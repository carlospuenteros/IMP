import { useState } from 'react'

export default function ResultsPanel({ original, scrubbed, summary, mode }) {
  const [copied, setCopied] = useState(false)
  const [showDiff, setShowDiff] = useState(false)

  async function copyToClipboard() {
    try {
      await navigator.clipboard.writeText(scrubbed)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback
      const ta = document.createElement('textarea')
      ta.value = scrubbed
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  function downloadFile() {
    const blob = new Blob([scrubbed], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `scrubbed_${Date.now()}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  const totalScrubbed = Object.values(summary).reduce((sum, s) => sum + s.count, 0)

  return (
    <div className="space-y-4">
      {/* Summary bar */}
      <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-green-400 font-medium text-sm">
            {totalScrubbed} sensitive item{totalScrubbed !== 1 ? 's' : ''} {mode === 'redact' ? 'redacted' : 'anonymized'}
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {Object.entries(summary).map(([label, data]) => (
            <span
              key={label}
              className="text-xs bg-gray-800 text-gray-300 px-2 py-1 rounded"
            >
              {label}: {data.count}
            </span>
          ))}
        </div>
      </div>

      {/* Toggle view */}
      <div className="flex gap-2">
        <button
          onClick={() => setShowDiff(false)}
          className={`px-3 py-1.5 rounded text-sm transition-colors ${
            !showDiff ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-gray-300'
          }`}
        >
          Scrubbed
        </button>
        <button
          onClick={() => setShowDiff(true)}
          className={`px-3 py-1.5 rounded text-sm transition-colors ${
            showDiff ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-gray-300'
          }`}
        >
          Compare
        </button>
      </div>

      {/* Content display */}
      {showDiff ? (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <h4 className="text-xs font-medium text-red-400 mb-1 uppercase tracking-wider">Original</h4>
            <pre className="bg-gray-800 border border-gray-700 rounded-lg p-4 text-sm text-gray-300 font-mono whitespace-pre-wrap break-words max-h-96 overflow-y-auto">
              {original}
            </pre>
          </div>
          <div>
            <h4 className="text-xs font-medium text-green-400 mb-1 uppercase tracking-wider">Scrubbed</h4>
            <pre className="bg-gray-800 border border-gray-700 rounded-lg p-4 text-sm text-gray-300 font-mono whitespace-pre-wrap break-words max-h-96 overflow-y-auto">
              {scrubbed}
            </pre>
          </div>
        </div>
      ) : (
        <pre className="bg-gray-800 border border-gray-700 rounded-lg p-4 text-sm text-gray-300 font-mono whitespace-pre-wrap break-words max-h-96 overflow-y-auto">
          {scrubbed}
        </pre>
      )}

      {/* Action buttons */}
      <div className="flex gap-3">
        <button
          onClick={copyToClipboard}
          className="flex-1 flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-700 text-gray-200 font-medium py-2.5 rounded-lg border border-gray-700 transition-colors"
        >
          {copied ? (
            <>
              <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Copied!
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
              </svg>
              Copy to Clipboard
            </>
          )}
        </button>
        <button
          onClick={downloadFile}
          className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2.5 rounded-lg transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Download File
        </button>
      </div>
    </div>
  )
}
