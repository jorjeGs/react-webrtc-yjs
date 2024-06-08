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

    // Update text state based on Yjs document changes
    yText.observe(event => {
      console.log('Text updated:', yText.toString());
      setText(yText.toString());
    });

    return () => {
      ydoc.current.destroy();
      if (ws.current) {
        ws.current.close();
      }
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

      switch (data.type) {
        case 'init': {
          // Decode and apply the initial state update received from the server
          console.log('Initial state:', data.message);
          const update = Y.decodeUpdate(data.message);
          ydoc.current.applyUpdate(update);
          break;
        }
        case 'update': {
          // Decode and apply subsequent state updates
          const update = Y.decodeUpdate(data.message);
          ydoc.current.applyUpdate(update);
          break;
        }
        default:
          console.log('Unknown message type:', data.type);
      }
    };

    ws.current.onclose = () => {
      console.log('WebSocket connection closed');
    };

    // Send updates to the server using Yjs encoded updates
    ydoc.current.on('update', (update) => {
      console.log('Sending update:', update);
      const encodedUpdate = Y.encodeStateAsUpdate(ydoc.current);
      console.log('Encoded update:', encodedUpdate);
      ws.current.send(JSON.stringify({ type: 'signal', room, message: encodedUpdate }));
    });
  };

  const handleChange = (e) => {
    const yText = ydoc.current.getText('shared-text');
    yText.delete(0, yText.length); // Clear existing text
    yText.insert(0, e.target.value); // Insert new text
  };

  return (
    <div className="App">
      <textarea value={text} onChange={handleChange} />
      <p>Room ID: {roomId}</p>
    </div>
  );
}

export default App;