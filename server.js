import express from 'express';
import http from 'http';
import { WebSocket, WebSocketServer } from 'ws';
import next from 'next';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

const DEFAULT_MODEL = "gpt-4o-mini";
const DEFAULT_URL = "wss://api.openai.com/v1/realtime";

app.prepare().then(() => {
  const server = express();
  const httpServer = http.createServer(server);
  
  // Create WebSocket server attached to the HTTP server
  let wss;
  try {
    wss = new WebSocketServer({ server: httpServer });
    
    wss.on('connection', (ws) => {
      console.log('Client connected to WebSocket');
      
      let openaiWs;
      try {
        openaiWs = new WebSocket(`${DEFAULT_URL}?model=${DEFAULT_MODEL}`, {
          headers: {
            "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
            "OpenAI-Beta": "realtime=v1"
          }
        });
      } catch (error) {
        console.error('Failed to connect to OpenAI WebSocket:', error);
        ws.close(1011, 'Failed to initialize OpenAI connection');
        return;
      }
      
      openaiWs.on('error', (error) => {
        console.error('WebSocket error:', error);
      });

      openaiWs.on('close', (event) => {
        console.log('WebSocket closed with code:', event.code);
        ws.close();
      });

      openaiWs.on('open', () => {
        console.log("Connected to OpenAI server");
        try {
          openaiWs.send(JSON.stringify({
            type: "session.update",
            session: {
              instructions: "You are a helpful AI assistant.",
              input_audio_transcription: {
                model: "whisper-1",
                language: "en"
              },
              modalities: ["text", "audio"],
              voice: "alloy"
            }
          }));

          openaiWs.send(JSON.stringify({
            type: 'input_audio_buffer.create',
            audio_format: {
              sample_rate: 24000,
              channel_count: 1,
              sample_size_bits: 16
            }
          }));
        } catch (error) {
          console.error('Error sending initial message:', error);
          ws.close(1011, 'Failed to initialize session');
        }
      });

      ws.on('message', async (message) => {
        try {
          const data = JSON.parse(message.toString());
          console.log('Received from client:', data.type);
          
          if (data.type === 'input_audio_buffer.append') {
            console.log('Received audio data of length:', data.audio.length);
          }
          
          if (openaiWs.readyState === WebSocket.OPEN) {
            openaiWs.send(JSON.stringify(data));
          }
        } catch (error) {
          console.error('Error processing message:', error);
          ws.close(1002, 'Invalid message format');
        }
      });

      openaiWs.on('message', (message) => {
        try {
          const data = JSON.parse(message.toString());
          console.log('Received from OpenAI:', data.type);
          
          if (data.type === "response.audio_transcript.done") {
            console.log("AI transcript:", data.transcript);
          } else if (data.type === "conversation.item.input_audio_transcription.completed") {
            console.log("User transcript:", data.transcript);
          } else if (data.type === "error") {
            console.error("OpenAI error:", data);
            if (ws.readyState === WebSocket.OPEN) {
              ws.close(1011, 'OpenAI error: ' + JSON.stringify(data.error));
            }
          }

          if (ws.readyState === WebSocket.OPEN) {
            ws.send(message.toString());
          }
        } catch (error) {
          console.error('Error processing OpenAI message:', error);
          if (ws.readyState === WebSocket.OPEN) {
            ws.close(1002, 'Invalid message format from OpenAI');
          }
        }
      });

      ws.on('error', (error) => {
        console.error('Client WebSocket error:', error);
      });

      ws.on('close', () => {
        console.log('Client disconnected');
        if (openaiWs.readyState === WebSocket.OPEN) {
          openaiWs.close();
        }
      });
    });
  } catch (error) {
    console.error('Failed to initialize WebSocket server:', error);
    // Continue with the rest of the application even if WebSocket fails
  }

  server.all('*', (req, res) => {
    return handle(req, res);
  });

  const PORT = process.env.PORT || 3000;
  httpServer.listen(PORT, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://localhost:${PORT}`);
  });
});
