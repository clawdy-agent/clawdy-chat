const { useState, useEffect, useRef } = React;

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [ws, setWs] = useState(null);
  const [joined, setJoined] = useState(false);
  const [userName, setUserName] = useState('');
  const [participants, setParticipants] = useState(0);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const socket = new WebSocket(`${protocol}//${window.location.host}`);

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
    return React.createElement('div', { className: 'join-screen' },
      React.createElement('h1', null, '⚡ Clawdy Chat'),
      React.createElement('p', null, 'Talk to clawdy in real-time'),
      React.createElement('input', {
        placeholder: 'Your name...',
        value: userName,
        onChange: (e) => setUserName(e.target.value),
        onKeyPress: (e) => e.key === 'Enter' && handleJoin()
      }),
      React.createElement('button', { onClick: handleJoin }, 'Join Chat')
    );
  }

  return React.createElement('div', { className: 'chat' },
    React.createElement('header', null,
      React.createElement('h1', null, '⚡ Clawdy Chat'),
      React.createElement('p', null, `👥 ${participants} in chat`)
    ),
    React.createElement('div', { className: 'messages' },
      messages.map((msg, i) =>
        React.createElement('div', { key: i, className: `message ${msg.type}` },
          msg.type === 'system' && React.createElement('span', { className: 'system-text' }, msg.text),
          msg.type === 'user_message' && [
            React.createElement('span', { key: 'name', className: 'user-name' }, msg.userName),
            React.createElement('span', { key: 'text', className: 'text' }, msg.text)
          ],
          msg.type === 'clawdy_message' && [
            React.createElement('span', { key: 'name', className: 'clawdy-name' }, '⚡ clawdy'),
            React.createElement('span', { key: 'text', className: 'text' }, msg.text)
          ]
        )
      ),
      React.createElement('div', { ref: messagesEndRef })
    ),
    React.createElement('div', { className: 'input-area' },
      React.createElement('input', {
        value: input,
        onChange: (e) => setInput(e.target.value),
        onKeyPress: (e) => e.key === 'Enter' && sendMessage(),
        placeholder: 'Say something...'
      }),
      React.createElement('button', { onClick: sendMessage }, 'Send')
    )
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(React.createElement(App));
