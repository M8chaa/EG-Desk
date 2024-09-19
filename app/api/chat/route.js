import { NextResponse } from 'next/server';
import { ChatOpenAI } from "@langchain/openai";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatAnthropic } from "@langchain/anthropic";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";

export const runtime = 'edge'; // Use Edge Runtime for faster cold starts

export async function POST(req) {
  try {
    const { message, model } = await req.json();

    let chatModel;
    switch (model) {
      case 'openai':
        chatModel = new ChatOpenAI({
          openAIApiKey: process.env.OPENAI_API_KEY,
          modelName: "gpt-3.5-turbo",
          temperature: 0.7,
        });
        break;
      case 'gemini':
        chatModel = new ChatGoogleGenerativeAI({
          apiKey: process.env.GOOGLE_API_KEY,
          modelName: "gemini-flash",
          temperature: 0.7,
        });
        break;
      case 'claude':
        chatModel = new ChatAnthropic({
          anthropicApiKey: process.env.ANTHROPIC_API_KEY,
          modelName: "claude-3.5",
          temperature: 0.7,
        });
        break;
      default:
        throw new Error('Invalid model selected');
    }

    const systemMessage = new SystemMessage("You are a helpful AI assistant.");
    const userMessage = new HumanMessage(message);

    const response = await chatModel.call([systemMessage, userMessage]);

    return NextResponse.json({ response: response.content }, { status: 200 });
  } catch (error) {
    console.error('Error processing chat request:', error);
    return NextResponse.json({ error: 'Failed to process chat request' }, { status: 500 });
  }
}

// Implement caching
export const revalidate = 3600; // Cache for 1 hour