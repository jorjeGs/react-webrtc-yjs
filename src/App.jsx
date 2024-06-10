import React, { useEffect, useState, useRef } from 'react';
import * as Y from 'yjs';
import { WebrtcProvider } from 'y-webrtc';
import { v4 as uuidv4 } from 'uuid';

const signalingServerUrl = 'ws://localhost:5000';

function App() {
  const [elementsArray, setElementsArray] = useState([]);
  const [roomId, setRoomId] = useState('');
  const ws = useRef(null);
  const ydoc = useRef(new Y.Doc());
  
  
  class CustomElement 
  {
    constructor(id, content)
    {
      this.id = id;
      this.content = content;
    }
  }

  useEffect(() => {
    
    const room = new URLSearchParams(window.location.search).get('room');

    const yarray = ydoc.current.getArray('array', Y.Array);
    if (room)
    {
      setRoomId(room);
      connectWebSocket(room);
    }
    else
    {
      createRoom();
    }

    //const provider = new WebrtcProvider(roomId, ydoc, { signaling: [signalingServerUrl] });

    yarray.observe((event) => {
      //send signal
      //check if the ws is not in connecting state
      console.log('Yjs array updated:', yarray.toJSON());
     setElementsArray(yarray.toJSON());
    });

    return () => {
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
        case 'joined': {
          console.log('Joined:', data.message);
          break;
        }
        case 'update': {
          // Decode and apply subsequent state updates
          ydoc.current.transact(() => {
            console.log('Update:', data.message);
            ydoc.current.transact(() => {
              Y.applyUpdate(ydoc.current, new Uint8Array(data.message));
            });
          });
          break;
        }
        default:
          console.log('Unknown message type:', data.type);
      }
    };

    ws.current.onclose = () => {
      console.log('WebSocket connection closed');
    };

    ydoc.current.on('update', (update) => {
      console.log('Yjs update:', Y.encodeStateAsUpdate(ydoc.current));
      ws.current.send(JSON.stringify({ type: 'signal',room:roomId, message: Y.encodeStateAsUpdate(ydoc.current) }));
    });
  };

  const createElement = () => {
    const new_id = uuidv4();
    const content = 'New element';

    const new_element = new CustomElement(new_id, content);
    // Add the new element to the Yjs array
    const yarray = ydoc.current.getArray('array');
    yarray.insert(yarray.length, [{id: new_id, content: content}]);
  }
  return (
    <div className="App">
      <button onClick={createElement}>Create Element</button>
      {/* Display the elements from the Yjs array here if the lenght > 0 */}
      {elementsArray.length > 0 && (
        <ul>
          {elementsArray.map((element, index) => (
            <li key={index}>{element.content}</li>
          ))}
        </ul>
      )}
      <h1>Room ID: {roomId}</h1>
    </div>
  );
}

export default App;