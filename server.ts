import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route for AI Level Generation using Gemini 3.6 Flash
  app.post('/api/generate-level', async (req, res) => {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: 'GEMINI_API_KEY environment variable missing' });
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: { 'User-Agent': 'aistudio-build' }
        }
      });

      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: 'Create a smart, solvable 2D physics puzzle level for a drawing physics game on a 420x600 canvas space. The ball starts near top (y: 60 to 120) and glass cup is near bottom (y: 450 to 520). Add 2-3 obstacles like walls, rotators, or portals.',
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              maxInk: { type: Type.NUMBER },
              ball: {
                type: Type.OBJECT,
                properties: {
                  x: { type: Type.NUMBER },
                  y: { type: Type.NUMBER },
                  radius: { type: Type.NUMBER }
                },
                required: ['x', 'y', 'radius']
              },
              glass: {
                type: Type.OBJECT,
                properties: {
                  x: { type: Type.NUMBER },
                  y: { type: Type.NUMBER },
                  width: { type: Type.NUMBER },
                  height: { type: Type.NUMBER }
                },
                required: ['x', 'y', 'width', 'height']
              },
              obstacles: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    type: { type: Type.STRING },
                    x: { type: Type.NUMBER },
                    y: { type: Type.NUMBER },
                    width: { type: Type.NUMBER },
                    height: { type: Type.NUMBER },
                    rotation: { type: Type.NUMBER },
                    speed: { type: Type.NUMBER }
                  },
                  required: ['id', 'type', 'x', 'y']
                }
              }
            },
            required: ['title', 'maxInk', 'ball', 'glass', 'obstacles']
          }
        }
      });

      if (response.text) {
        const levelData = JSON.parse(response.text);
        return res.json({ level: levelData });
      } else {
        return res.status(500).json({ error: 'No response from AI model' });
      }
    } catch (err: any) {
      console.error('AI level generation error:', err);
      return res.status(500).json({ error: err?.message || 'Failed to generate level' });
    }
  });

  // Vite middleware setup
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
