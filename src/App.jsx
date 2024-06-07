import React, { useEffect, useState, useRef } from 'react';
import * as Y from 'yjs';
import { v4 as uuidv4 } from 'uuid';

const signalingServerUrl = 'ws://localhost:1234';

function App() {
  const [text, setText] = useState('');
  const [roomId, setRoomId] = useState('');
  const ws = useRef(null);
  const ydoc = useRef(new Y.Doc());

  useEffect(() => {
    const room = new URLSearchParams(window.location.search).get('room');
    if (room) {
      setRoomId(room);
      connectWebSocket(room);
    } else {
      createRoom();
    }

    const yText = ydoc.current.getText('shared-text');

    yText.observe(event => {
      console.log('Text updated:', yText.toString());
      setText(yText.toString());
    });

    return () => {
      ydoc.current.destroy();
    };
  }, []);

  const createRoom = () => {
    const newRoomId = uuidv4();
    setRoomId(newRoomId);
    window.history.pushState(null, null, `?room=${newRoomId}`);
    connectWebSocket(newRoomId);
  };

  const connectWebSocket = (room) => {
    ws.current = new WebSocket(signalingServerUrl);

    ws.current.onopen = () => {
      ws.current.send(JSON.stringify({ type: 'join', room }));
    };

    ws.current.onmessage = (message) => {
      const data = JSON.parse(message.data);

      if (data.type === 'init' && data.message) {
        // Apply the initial state
        console.log('Received initial data:', new Uint8Array(data.message));
        Y.applyUpdate(ydoc.current, new Uint8Array(data.message));
        setText(ydoc.current.getText('shared-text').toString());
      }

      console.log('Received data:', new Uint8Array(data.message));
      if (data.type === 'signal' && data.room === room) {
        Y.applyUpdate(ydoc.current, new Uint8Array(data.message));
      }
    };

    ws.current.onclose = () => {
      console.log('WebSocket connection closed');
    };

    ydoc.current.on('update', (update) => {
      ws.current.send(JSON.stringify({ type: 'signal', room, message: Array.from(update) }));
      console.log('update:', JSON.stringify({ type: 'signal', room, message: new Uint8Array(Array.from(update)) }));
    });
  };

  const handleChange = (e) => {
    const yText = ydoc.current.getText('shared-text');
    yText.delete(0, yText.length);
    yText.insert(0, e.target.value);
  };

  return (
    <div className="App">
      <textarea value={text} onChange={handleChange} />
      <p>Room ID: {roomId}</p>
    </div>
  );
}

export default App;