import { ChatOpenAI } from "@langchain/openai";
import { AgentExecutor, createOpenAIFunctionsAgent } from "langchain/agents";
import { GoogleSheetsTools } from './tools';
import { LanguageDetector } from "@/lib/languageDetector";
import { BufferMemory } from "langchain/memory";

// Agent memory to maintain context between operations
const agentMemory = new BufferMemory({
  returnMessages: true,
  memoryKey: "agent_history",
});

export async function POST(req) {
  try {
    const { accessToken, orderBy, action, sheetId, range, language, title } = await req.json();
    console.log('Request data:', { accessToken: !!accessToken, orderBy, action, sheetId, range, language, title });

    if (!accessToken) {
      return new Response(JSON.stringify({ error: 'Access token is missing' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // If it's a list request, fetch files from Google Drive API
    if (!action || action === 'list') {
      const driveResponse = await fetch(
        'https://www.googleapis.com/drive/v3/files?' + new URLSearchParams({
          q: "mimeType='application/vnd.google-apps.spreadsheet' and 'me' in owners",
          orderBy: orderBy === 'lastOpened' ? 'viewedByMeTime desc' : 'modifiedTime desc',
          fields: 'files(id, name, thumbnailLink)',
        }), {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (!driveResponse.ok) {
        throw new Error('Failed to fetch files from Google Drive');
      }

      const data = await driveResponse.json();
      console.log("Google Drive API response:", data.files);
      return new Response(JSON.stringify(data.files), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Initialize language detector if language is not provided
    let detectedLanguage = language;
    if (!detectedLanguage) {
      const languageDetector = new LanguageDetector();
      detectedLanguage = await languageDetector.detect(action);
    }

    // For create operation, we don't need a sheet ID
    if (action !== 'create' && !sheetId) {
      return new Response(JSON.stringify({ error: 'Sheet ID is required for this operation' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const sheetsTools = new GoogleSheetsTools(accessToken, sheetId, detectedLanguage);
    const tools = [
      sheetsTools.getReadSheetTool(),
      sheetsTools.getWriteSheetTool(),
      sheetsTools.getAnalyzeSheetTool(),
      sheetsTools.getCreateSheetTool(),
    ];

    const model = new ChatOpenAI({
      openAIApiKey: process.env.OPENAI_API_KEY,
      modelName: "gpt-4o-mini",
      temperature: 0.7,
    });

    // Create agent with language support
    const agent = await createOpenAIFunctionsAgent({
      llm: model,
      tools,
      systemMessage: `You are a helpful assistant that works with Google Sheets.
        Please respond in ${detectedLanguage}.
        Previous operations: {agent_history}
        Current operation: {input}
        {agent_scratchpad}`,
    });

    const agentExecutor = new AgentExecutor({
      agent,
      tools,
      memory: agentMemory,
    });

    let result;
    const agentInput = {
      input: `Perform the following operation in ${detectedLanguage}: ${action}`,
      range,
      language: detectedLanguage,
    };

    switch (action) {
      case 'create':
        result = await agentExecutor.invoke({
          ...agentInput,
          action: 'create',
          title: title || 'New Spreadsheet',
        });
        break;
      case 'read':
        result = await agentExecutor.invoke({
          ...agentInput,
          action: 'read',
        });
        break;
      case 'write':
        const { values } = req.body;
        result = await agentExecutor.invoke({
          ...agentInput,
          action: 'write',
          values,
        });
        break;
      case 'analyze':
        result = await agentExecutor.invoke({
          ...agentInput,
          action: 'analyze',
        });
        break;
      default:
        throw new Error('Invalid action specified');
    }

    // Save operation result to memory
    await agentMemory.saveContext(
      { input: action },
      { output: JSON.stringify(result) }
    );

    return new Response(JSON.stringify({
      result: result.output || result,
      language: detectedLanguage,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in sheets operation:', error);
    return new Response(JSON.stringify({ error: 'Failed to perform sheet operation' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
