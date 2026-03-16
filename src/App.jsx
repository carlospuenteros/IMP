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

  // Handle text input changes - auto-detect sensitive data
  const handleTextChange = useCallback((text) => {
    setInputText(text)
    setResult(null)
    if (text.trim().length > 10) {
      // Debounced detection
      const detected = detectSensitiveData(text)
      setFindings(detected)
    } else {
      setFindings([])
    }
  }, [])

  // Handle file content
  const handleFileContent = useCallback((content) => {
    handleTextChange(content)
  }, [handleTextChange])

  // Perform scrubbing
  function handleScrub() {
    if (!inputText.trim()) return
    setScanning(true)
    // Use setTimeout to let the UI update before heavy processing
    setTimeout(() => {
      const detected = detectSensitiveData(inputText)
      const { scrubbed, summary } = scrubText(inputText, detected, mode)
      setResult({ original: inputText, scrubbed, summary })
      setScanning(false)
    }, 50)
  }

  // Reset to start over
  function handleReset() {
    setInputText('')
    setFindings([])
    setResult(null)
  }

  // Handle logout
  function handleLogout() {
    logout()
    setAuthed(false)
    handleReset()
  }

  if (!authed) {
    return <PinScreen onAuthenticated={() => setAuthed(true)} />
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      {/* Header */}
      <header className="border-b border-gray-800">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-600/20 flex items-center justify-center">
              <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-bold text-white leading-tight">DataScrub</h1>
              <p className="text-xs text-gray-500">Clean your data before AI</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {result && (
              <button
                onClick={handleReset}
                className="text-sm text-gray-400 hover:text-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-800 transition-colors"
              >
                New Scrub
              </button>
            )}
            <button
              onClick={handleLogout}
              className="text-sm text-gray-500 hover:text-gray-300 px-3 py-1.5 rounded-lg hover:bg-gray-800 transition-colors"
            >
              Lock
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {!result ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left: Input */}
            <div className="lg:col-span-2">
              <FileUpload
                onFileContent={handleFileContent}
                onTextInput={handleTextChange}
                textValue={inputText}
              />
            </div>

            {/* Right: Controls */}
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
      <footer className="border-t border-gray-800 mt-auto">
        <div className="max-w-6xl mx-auto px-4 py-4 text-center">
          <p className="text-xs text-gray-600">
            All processing happens locally in your browser. No data is sent to any server.
          </p>
        </div>
      </footer>
    </div>
  )
}

export default App
