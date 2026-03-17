import { useState, useCallback } from 'react'
import { isAuthenticated, logout } from './lib/pinAuth'
import { detectSensitiveData, scrubText } from './lib/detection'
import PinScreen from './components/PinScreen'
import FileUpload from './components/FileUpload'
import ScrubControls from './components/ScrubControls'
import ResultsPanel from './components/ResultsPanel'

function App() {
  const [authed, setAuthed] = useState(isAuthenticated())
  const [inputText, setInputText] = useState('')
  const [mode, setMode] = useState('redact')
  const [findings, setFindings] = useState([])
  const [result, setResult] = useState(null)
  const [scanning, setScanning] = useState(false)

  const handleTextChange = useCallback((text) => {
    setInputText(text)
    setResult(null)
    if (text.trim().length > 10) {
      const detected = detectSensitiveData(text)
      setFindings(detected)
    } else {
      setFindings([])
    }
  }, [])

  const handleFileContent = useCallback((content) => {
    handleTextChange(content)
  }, [handleTextChange])

  function handleScrub() {
    if (!inputText.trim()) return
    setScanning(true)
    setTimeout(() => {
      const detected = detectSensitiveData(inputText)
      const { scrubbed, summary } = scrubText(inputText, detected, mode)
      setResult({ original: inputText, scrubbed, summary })
      setScanning(false)
    }, 50)
  }

  function handleReset() {
    setInputText('')
    setFindings([])
    setResult(null)
  }

  function handleLogout() {
    logout()
    setAuthed(false)
    handleReset()
  }

  if (!authed) {
    return <PinScreen onAuthenticated={() => setAuthed(true)} />
  }

  return (
    <div className="min-h-screen bg-white text-neutral-900 flex flex-col">
      {/* Header */}
      <header className="border-b border-neutral-200">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <svg className="w-6 h-6 text-neutral-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <div>
              <h1 className="text-base font-semibold text-neutral-900 leading-tight tracking-tight">DataScrub</h1>
              <p className="text-xs text-neutral-400">Clean your data before AI</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {result && (
              <button
                onClick={handleReset}
                className="text-sm text-neutral-600 hover:text-neutral-900 px-3 py-1.5 rounded-lg hover:bg-neutral-100 transition-colors cursor-pointer"
              >
                New scrub
              </button>
            )}
            <button
              onClick={handleLogout}
              className="text-sm text-neutral-400 hover:text-neutral-600 px-3 py-1.5 rounded-lg hover:bg-neutral-100 transition-colors cursor-pointer"
            >
              Lock
            </button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-5xl mx-auto px-6 py-8 w-full flex-1">
        {!result ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <FileUpload
                onFileContent={handleFileContent}
                onTextInput={handleTextChange}
                textValue={inputText}
              />
            </div>
            <div>
              <ScrubControls
                mode={mode}
                onModeChange={setMode}
                onScrub={handleScrub}
                disabled={!inputText.trim() || scanning}
                findings={findings}
              />
            </div>
          </div>
        ) : (
          <ResultsPanel
            original={result.original}
            scrubbed={result.scrubbed}
            summary={result.summary}
            mode={mode}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-neutral-100">
        <div className="max-w-5xl mx-auto px-6 py-4 text-center">
          <p className="text-xs text-neutral-400">
            All processing happens locally in your browser. No data is sent to any server.
          </p>
        </div>
      </footer>
    </div>
  )
}

export default App
