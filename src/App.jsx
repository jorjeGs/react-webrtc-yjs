import { useRef, useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import * as Y from 'yjs';
import { WebrtcProvider } from 'y-webrtc';
import { MonacoBinding } from 'y-monaco';
import { v4 as uuidv4 } from 'uuid';

const signalingServerUrl = 'ws://localhost:1234';

function App() {

  const editorRef = useRef(null);
  const ws = useRef(null);
  const [roomId, setRoomId] = useState('');

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;

    const doc = new Y.Doc();
    console.log('doc', doc);

    // Initialize WebRTC provider with the room ID
    const provider = new WebrtcProvider(roomId, doc);
    const type = doc.getText('monaco');

    // Bind Yjs to Monaco editor
    new MonacoBinding(type, editorRef.current.getModel(), new Set([editorRef.current]), provider.awareness);
    console.log('provider', provider);

    // Handle signaling messages
    ws.current.onmessage = (message) => {
      const data = JSON.parse(message.data);
      if (data.type === 'signal' && data.room === roomId) {
        provider.signalingMessage(data.message);
      }
    };

    provider.on('signal', (message) => {
      ws.current.send(JSON.stringify({ type: 'signal', room: roomId, message }));
    });
  };

  const createOrJoinRoom = () => {
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

    ws.current.onclose = () => {
      console.log('WebSocket connection closed');
    };
  };

  useEffect(() => {
    const room = new URLSearchParams(window.location.search).get('room');
    if (room) {
      setRoomId(room);
      connectWebSocket(room);
    } else {
      createOrJoinRoom();
    }
  }, []);

  return (
    <>
      <Editor
        height='100vh'
        width='100vw'
        theme='vs-dark'
        onMount={handleEditorDidMount}
      />
    </>
  );
}

export default App;
