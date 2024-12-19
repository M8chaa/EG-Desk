import { NextResponse } from 'next/server';
import { ChatOpenAI } from "@langchain/openai";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatAnthropic } from "@langchain/anthropic";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { ConversationChain } from "langchain/chains";
import { BufferMemory } from "langchain/memory";
import { PromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { RunnableSequence } from "@langchain/core/runnables";
import { LanguageDetector } from "@/lib/languageDetector";
import { AgentExecutor, createOpenAIFunctionsAgent } from "langchain/agents";
import { GoogleSheetsTools } from '@/app/api/sheets/tools';

export const runtime = 'edge';

// Define templates for different operations with language support
const sheetOperationsTemplate = new PromptTemplate({
  template: `You are a helpful AI assistant specialized in Google Sheets operations.
You should respond in the same language as the user's input.
Current sheet ID: {sheetId}
Previous conversation: {history}
Current language: {language}
Human: {input}
Assistant: Let me help you with that.`,
  inputVariables: ["sheetId", "history", "language", "input"]
});

const generalConversationTemplate = new PromptTemplate({
  template: `You are a helpful AI assistant.
You should respond in the same language as the user's input.
Previous conversation: {history}
Current language: {language}
Human: {input}
Assistant: Let me help you with that.`,
  inputVariables: ["history", "language", "input"]
});

// Define agent communication templates
const controllerAgentTemplate = new PromptTemplate({
  template: `You are the Controller Agent responsible for coordinating sheet operations.
You should respond in the same language as the user's input.
Current language: {language}
Previous actions: {history}
Current request: {input}
Sheet ID: {sheetId}

Your role is to:
1. Analyze the user's request
2. Coordinate with other agents
3. Ensure proper flow of operations
4. Maintain context across agent communications

When delegating tasks:
1. Pass relevant context to specialized agents
2. Include language preference for consistent communication
3. Track and update operation status
4. Ensure response consistency`,
  inputVariables: ["language", "history", "input", "sheetId"]
});

const sheetCreationAgentTemplate = new PromptTemplate({
  template: `You are the Sheet Creation Agent.
You should respond in the same language as the user's input.
Current language: {language}
Previous actions: {history}
Controller request: {input}

Your role is to:
1. Create new sheets based on requirements
2. Structure data appropriately
3. Report back creation status
4. Handle template applications`,
  inputVariables: ["language", "history", "input"]
});

const sheetEditorAgentTemplate = new PromptTemplate({
  template: `You are the Sheet Editor Agent.
You should respond in the same language as the user's input.
Current language: {language}
Previous actions: {history}
Controller request: {input}
Sheet ID: {sheetId}

Your role is to:
1. Modify existing sheets
2. Update data structures
3. Apply formatting
4. Validate changes`,
  inputVariables: ["language", "history", "input", "sheetId"]
});

export async function POST(req) {
  try {
    const { message, model, image, sheetId, accessToken } = await req.json();
    
    // Add request data logging
    console.log('Request data:', { 
      messageLength: message?.length, 
      model, 
      hasImage: !!image, 
      sheetId, 
      hasAccessToken: !!accessToken 
    });

    // Detect language of the input message
    const languageDetector = new LanguageDetector();
    const detectedLanguage = await languageDetector.detect(message);
    console.log('Detected language:', detectedLanguage);

    let chatModel;
    try {
      switch (model) {
        case 'openai':
          chatModel = new ChatOpenAI({
            openAIApiKey: process.env.OPENAI_API_KEY,
            modelName: image ? "gpt-4o" : "gpt-4o",
            temperature: 0.7,
            maxTokens: image ? 300 : undefined,
          });
          break;
        case 'gemini':
          chatModel = new ChatGoogleGenerativeAI({
            apiKey: process.env.GOOGLE_API_KEY,
            modelName: image ? "gemini-pro-vision" : "gemini-pro",
            temperature: 0.7,
          });
          break;
        case 'claude':
          chatModel = new ChatAnthropic({
            anthropicApiKey: process.env.ANTHROPIC_API_KEY,
            modelName: image ? "claude-3-opus" : "claude-3-sonnet",
            temperature: 0.7,
          });
          break;
        default:
          throw new Error('Invalid model selected');
      }
      console.log('Chat model initialized:', model);
    } catch (error) {
      console.error('Error initializing chat model:', error);
      throw error;
    }

    // Initialize Google Sheets tools if accessToken is provided
    let sheetsTools;
    let agentExecutor;
    if (accessToken) {
      try {
        console.log('Initializing Google Sheets tools...');
        sheetsTools = new GoogleSheetsTools(accessToken, sheetId, detectedLanguage);
        
        // Get tools and validate them
        const tools = [];
        
        // Only add create_sheet tool if no sheetId is provided
        if (!sheetId) {
          const createTool = sheetsTools.getCreateSheetTool();
          console.log('Create tool:', JSON.stringify({
            name: createTool.name,
            description: createTool.description,
            schema: createTool.schema
          }));
          tools.push(createTool);
        }
        
        // Add other tools only if sheetId is provided
        if (sheetId) {
          const readTool = sheetsTools.getReadSheetTool();
          const writeTool = sheetsTools.getWriteSheetTool();
          const analyzeTool = sheetsTools.getAnalyzeSheetTool();
          
          if (readTool) tools.push(readTool);
          if (writeTool) tools.push(writeTool);
          if (analyzeTool) tools.push(analyzeTool);
        }

        if (tools.length === 0) {
          console.error('No tools were initialized');
          throw new Error('Failed to initialize sheet tools');
        }

        console.log('Tools initialized:', tools.map(tool => ({
          name: tool.name,
          description: tool.description,
          schema: tool.schema
        })));

        // Create a proper prompt template for the agent
        const agentPrompt = new PromptTemplate({
          template: `You are a helpful assistant that works with Google Sheets.
Please respond in {language}.

Your primary responsibilities:
1. Identify user requests related to Google Sheets operations
2. For sheet creation requests:
   - You MUST use the create_sheet tool when a user asks to create a sheet
   - Extract the title from the user's request (e.g., "create a sheet called X" -> title: "X")
   - If no title is specified, use a descriptive title based on the context
   - DO NOT suggest manual steps or redirect to Google Drive
   - After creation, provide the sheet URL to the user
3. For other sheet operations (read, write, analyze):
   - Use the appropriate tool based on the request
   - Provide clear feedback about the operation results

Important: You have direct access to create Google Sheets through the create_sheet tool.
Never suggest manual steps. Always use the tools provided.
When a user asks to create a sheet, you MUST use the create_sheet tool directly.

Available tools:
{tools}

Current request: {input}
{agent_scratchpad}`,
          inputVariables: ["language", "input", "agent_scratchpad", "tools"]
        });

        console.log('Creating OpenAI Functions agent...');
        const agent = await createOpenAIFunctionsAgent({
          llm: chatModel,
          tools,
          prompt: agentPrompt
        });

        console.log('Creating AgentExecutor...');
        agentExecutor = new AgentExecutor({
          agent,
          tools,
          returnIntermediateSteps: true,
          verbose: true
        });
        
        console.log('Agent setup completed successfully');
      } catch (error) {
        console.error('Error setting up agent:', error);
        console.error('Agent setup error details:', {
          name: error.name,
          message: error.message,
          stack: error.stack
        });
        throw error;
      }
    }

    // Initialize memory with language context
    const memory = new BufferMemory({
      returnMessages: true,
      memoryKey: "history",
      inputKey: "input",
      outputKey: "output",
    });

    let response;
    if (image) {
      // Handle image input with language support
      const systemMessage = new SystemMessage(
        `You are a helpful AI assistant capable of understanding both images and text. 
         Analyze both the image and any text provided to give accurate, relevant responses.
         Please respond in ${detectedLanguage}.`
      );

      const userMessage = new HumanMessage({
        content: [
          {
            type: "text",
            text: message || "What do you see in this image?"
          },
          {
            type: "image_url",
            image_url: {
              url: image.url
            }
          }
        ]
      });

      const result = await chatModel.call([systemMessage, userMessage], {
        maxTokens: 300,
        temperature: 0.7,
      });
      response = result.content;
    } else {
      console.log('Processing text message');
      const isSheetRelated = message.toLowerCase().includes('sheet') || 
                            message.toLowerCase().includes('스프레드시트') ||
                            message.toLowerCase().includes('시트') ||
                            message.toLowerCase().includes('spreadsheet');
      
      if (isSheetRelated && agentExecutor) {
        console.log('Using agent executor for sheet operations');
        try {
          // Validate agent executor configuration
          if (!agentExecutor.agent) {
            throw new Error('Agent is not properly initialized');
          }
          if (!agentExecutor.tools || agentExecutor.tools.length === 0) {
            throw new Error('Tools are not properly initialized');
          }

          console.log('Agent executor validation passed:', {
            hasAgent: !!agentExecutor.agent,
            toolCount: agentExecutor.tools.length,
            toolNames: agentExecutor.tools.map(t => t.name)
          });

          const result = await agentExecutor.invoke({
            input: message,
            language: detectedLanguage,
            tools: agentExecutor.tools.map(tool => `${tool.name}: ${tool.description}`).join('\n')
          });
          
          console.log('Agent execution completed successfully');
          console.log('Result:', result);

          // Check if the response contains sheet info
          if (result.output && typeof result.output === 'object' && result.output.sheetInfo) {
            response = result.output.message;
          } else if (result.output && typeof result.output === 'string') {
            response = result.output;
          } else {
            console.log('Unexpected result format:', result);
            response = '죄송합니다. 시트 작업 중 오류가 발생했습니다.';
          }
        } catch (error) {
          console.error('Error executing agent:', error);
          console.error('Agent execution error details:', {
            name: error.name,
            message: error.message,
            stack: error.stack
          });
          response = '죄송합니다. 시트 작업 중 오류가 발생했습니다.';
        }
      } else {
        console.log('Starting regular conversation chain');
        // Use regular conversation chain for non-sheet operations
        const memoryResult = await memory.loadMemoryVariables({});
        console.log('Memory loaded:', memoryResult);

        const systemMessage = new SystemMessage(
          `You are a helpful AI assistant. Please respond in ${detectedLanguage}.`
        );

        const userMessage = new HumanMessage(message);

        const result = await chatModel.call([systemMessage, userMessage]);
        console.log('Chat model response received');
        response = result.content;
      }
    }

    // Save the interaction to memory with language context
    await memory.saveContext(
      { input: message, language: detectedLanguage },
      { output: response }
    );

    return NextResponse.json({ 
      response,
      detectedLanguage,
    }, { status: 200 });
  } catch (error) {
    console.error('Error processing chat request:', error);
    console.error('Full error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    return NextResponse.json({ error: 'Failed to process chat request' }, { status: 500 });
  }
}

// Implement caching
export const revalidate = 3600; // Cache for 1 hour

// 디버깅을 위한 로그 추가
console.log('Template definition:', {
  template: generalConversationTemplate.template,
  variables: generalConversationTemplate.inputVariables
});