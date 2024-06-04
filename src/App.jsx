import { useRef } from 'react'
import Editor from '@monaco-editor/react'
import * as Y from 'yjs'
import { WebrtcProvider } from 'y-webrtc'
import { MonacoBinding } from 'y-monaco'

function App() {
  
  const editorRef = useRef(null)
  
  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor
    //initialize yjs
    const doc = new Y.Doc() //collection of shared data
    console.log('doc', doc)
    //connect to peers (or start connection) with webRT
    const provider = new WebrtcProvider('monaco-yjs-demo-room', doc) // room1, room2
    const type = doc.getText('monaco') // doc { "monaco": "what the IDE is showing"}
    //bind yjs to monaco
    const monacoBinding = new MonacoBinding(type, editorRef.current.getModel(), new Set([editorRef.current]), provider.awareness)
    console.log('monacoBinding', monacoBinding)
    console.log('provider', provider)

  }

  return (
    <>
      <Editor
        height='100vh'
        width='100vw'
        theme='vs-dark'
        onMount={handleEditorDidMount}
      />
    </>
  )
}

export default App
