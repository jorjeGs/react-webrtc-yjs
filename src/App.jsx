import Editor from '@monaco-editor/react'
import './App.css'

function App() {

  const handleEditorDidMount = (editor, monaco) => {
    editor.focus()
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
