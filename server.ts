import express from "express";
import { createServer as createViteServer } from "vite";
import fs from "fs";
import path from "path";

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));

const DATA_FILE = path.resolve('sync_data.json');

// Helper to read/write data
const readData = () => {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const content = fs.readFileSync(DATA_FILE, 'utf-8');
      return JSON.parse(content);
    }
  } catch (e) {
    console.error("Error reading data file", e);
  }
  return {};
};

const writeData = (data: any) => {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data), 'utf-8');
  } catch (e) {
    console.error("Error writing data file", e);
  }
};

// API routes
app.get("/api/sync/:roomId", (req, res) => {
  const { roomId } = req.params;
  const data = readData();
  res.json(data[roomId] || null);
});

app.post("/api/sync/:roomId", (req, res) => {
  const { roomId } = req.params;
  const payload = req.body;
  
  const data = readData();
  
  // Simple merge logic on the server:
  // If no existing data, just save it.
  // If existing data, we could merge it, but for simplicity, the client can handle merging
  // and just push the merged state to the server.
  // Actually, to prevent overwriting, we should let the client fetch, merge, and then push.
  // But if two clients push at the same time, one might overwrite the other.
  // Let's implement a simple merge on the server based on updatedAt.
  
  const existing = data[roomId] || {
    activities: [], movies: [], food: [], registry: [], loveNotes: [], logs: [], recipes: [], timestamp: 0
  };
  
  const mergeCollection = (key: string) => {
    const map = new Map();
    (existing[key] || []).forEach((i: any) => map.set(i.id, i));
    (payload[key] || []).forEach((remoteItem: any) => {
      const localItem = map.get(remoteItem.id);
      if (!localItem) {
        map.set(remoteItem.id, remoteItem);
      } else {
        const localTime = localItem.updatedAt || 0;
        const remoteTime = remoteItem.updatedAt || 0;
        if (remoteTime > localTime) {
          map.set(remoteItem.id, remoteItem);
        }
      }
    });
    return Array.from(map.values());
  };

  const merged = {
    activities: mergeCollection('activities'),
    movies: mergeCollection('movies'),
    food: mergeCollection('food'),
    registry: mergeCollection('registry'),
    loveNotes: mergeCollection('loveNotes'),
    logs: mergeCollection('logs'),
    recipes: mergeCollection('recipes'),
    timestamp: Math.max(existing.timestamp || 0, payload.timestamp || 0)
  };

  data[roomId] = merged;
  writeData(data);
  
  res.json(merged);
});

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
