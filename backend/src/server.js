const express = require('express');
const WebSocket = require('ws');
const http = require('http');
const cors = require('cors');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../../frontend/src')));

// Serve index.html for root path
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../../frontend/src/index.html'));
});

const participants = new Map();
const messageHistory = [];

wss.on('connection', (ws) => {
  let userId = null;

  ws.on('message', (data) => {
    try {
      const msg = JSON.parse(data);

      if (msg.type === 'join') {
        userId = msg.userId || `user_${Date.now()}`;
        const name = msg.name || 'Anonymous';
        participants.set(userId, { name, ws });

        broadcast({
          type: 'system',
          text: `${name} joined the chat`,
          timestamp: new Date().toISOString()
        });

        ws.send(JSON.stringify({
          type: 'history',
          messages: messageHistory.slice(-50)
        }));

      } else if (msg.type === 'message') {
        const userInfo = participants.get(userId);
        if (!userInfo) return;

        const messageData = {
          id: Date.now(),
          userId: userId,
          userName: userInfo.name,
          text: msg.text,
          timestamp: new Date().toISOString()
        };

        messageHistory.push(messageData);

        broadcast({
          type: 'user_message',
          ...messageData
        });

        setTimeout(() => {
          const clawdyResponse = generateClawdyResponse(msg.text);
          broadcast({
            type: 'clawdy_message',
            id: Date.now() + 1,
            text: clawdyResponse,
            timestamp: new Date().toISOString()
          });
        }, 500 + Math.random() * 1000);
      }
    } catch (e) {
      console.error('Error:', e);
    }
  });

  ws.on('close', () => {
    if (userId && participants.has(userId)) {
      const name = participants.get(userId).name;
      participants.delete(userId);
      broadcast({
        type: 'system',
        text: `${name} left the chat`
      });
    }
  });
});

function generateClawdyResponse(message) {
  const text = message.toLowerCase();
  if (text.includes('?')) {
    return 'Interesting question. Tell me more.';
  }
  if (text.includes('help') || text.includes('can you')) {
    return 'Yeah, what do you need?';
  }
  if (text.length < 10) {
    return 'Got it.';
  }
  return 'Noted. Anything else?';
}

function broadcast(data) {
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  });
}

const PORT = process.env.PORT || 3002;
server.listen(PORT, () => {
  console.log(`✓ Clawdy Chat on :${PORT}`);
});
