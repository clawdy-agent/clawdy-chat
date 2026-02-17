import React, { useState, useEffect, useRef } from 'react';
import './App.css';

export default function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [ws, setWs] = useState(null);
  const [joined, setJoined] = useState(false);
  const [userName, setUserName] = useState('');
  const [participants, setParticipants] = useState(0);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const socket = new WebSocket('ws://localhost:3002');

    socket.onmessage = (event) => {
      const msg = JSON.parse(event.data);

      if (msg.type === 'history') {
        setMessages(msg.messages);
      } else if (msg.type === 'system') {
        setMessages(prev => [...prev, msg]);
        if (msg.text.includes('joined')) {
          setParticipants(p => p + 1);
        } else if (msg.text.includes('left')) {
          setParticipants(p => Math.max(0, p - 1));
        }
      } else {
        setMessages(prev => [...prev, msg]);
      }
    };

    setWs(socket);
    return () => socket.close();
  }, []);

  const handleJoin = () => {
    if (!userName.trim() || !ws) return;
    ws.send(JSON.stringify({
      type: 'join',
      userId: `user_${Date.now()}`,
      name: userName
    }));
    setJoined(true);
  };

  const sendMessage = () => {
    if (!input.trim() || !ws) return;
    ws.send(JSON.stringify({
      type: 'message',
      text: input
    }));
    setInput('');
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!joined) {
    return (
      <div className="join-screen">
        <h1>⚡ Clawdy Chat</h1>
        <p>Talk to clawdy in real-time</p>
        <input
          placeholder="Your name..."
          value={userName}
          onChange={e => setUserName(e.target.value)}
          onKeyPress={e => e.key === 'Enter' && handleJoin()}
        />
        <button onClick={handleJoin}>Join Chat</button>
      </div>
    );
  }

  return (
    <div className="chat">
      <header>
        <h1>⚡ Clawdy Chat</h1>
        <p>👥 {participants} in chat</p>
      </header>

      <div className="messages">
        {messages.map((msg, i) => (
          <div key={i} className={`message ${msg.type}`}>
            {msg.type === 'system' && (
              <span className="system-text">{msg.text}</span>
            )}
            {msg.type === 'user_message' && (
              <>
                <span className="user-name">{msg.userName}</span>
                <span className="text">{msg.text}</span>
              </>
            )}
            {msg.type === 'clawdy_message' && (
              <>
                <span className="clawdy-name">⚡ clawdy</span>
                <span className="text">{msg.text}</span>
              </>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="input-area">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyPress={e => e.key === 'Enter' && sendMessage()}
          placeholder="Say something..."
        />
        <button onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
}
