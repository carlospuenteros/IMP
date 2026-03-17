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
    <div className="space-y-5">
      {/* Summary */}
      <div className="rounded-xl border border-neutral-200 p-4">
        <div className="flex items-center gap-2 mb-3">
          <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-neutral-900 font-medium text-sm">
            {totalScrubbed} item{totalScrubbed !== 1 ? 's' : ''} {mode === 'redact' ? 'redacted' : 'anonymized'}
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {Object.entries(summary).map(([label, data]) => (
            <span
              key={label}
              className="text-xs bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded-full font-medium"
            >
              {label}: {data.count}
            </span>
          ))}
        </div>
      </div>

      {/* View toggle */}
      <div className="inline-flex rounded-lg border border-neutral-200 p-0.5">
        <button
          onClick={() => setShowDiff(false)}
          className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors cursor-pointer ${
            !showDiff ? 'bg-neutral-900 text-white' : 'text-neutral-500 hover:text-neutral-700'
          }`}
        >
          Scrubbed
        </button>
        <button
          onClick={() => setShowDiff(true)}
          className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors cursor-pointer ${
            showDiff ? 'bg-neutral-900 text-white' : 'text-neutral-500 hover:text-neutral-700'
          }`}
        >
          Compare
        </button>
      </div>

      {/* Content */}
      {showDiff ? (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h4 className="text-xs font-medium text-neutral-400 mb-1.5 uppercase tracking-wider">Original</h4>
            <pre className="bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm text-neutral-700 font-mono whitespace-pre-wrap break-words max-h-[28rem] overflow-y-auto">
              {original}
            </pre>
          </div>
          <div>
            <h4 className="text-xs font-medium text-neutral-400 mb-1.5 uppercase tracking-wider">Scrubbed</h4>
            <pre className="bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm text-neutral-700 font-mono whitespace-pre-wrap break-words max-h-[28rem] overflow-y-auto">
              {scrubbed}
            </pre>
          </div>
        </div>
      ) : (
        <pre className="bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm text-neutral-700 font-mono whitespace-pre-wrap break-words max-h-[28rem] overflow-y-auto">
          {scrubbed}
        </pre>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={copyToClipboard}
          className="flex-1 flex items-center justify-center gap-2 border border-neutral-300 hover:border-neutral-400 text-neutral-700 font-medium py-2.5 rounded-xl transition-colors cursor-pointer"
        >
          {copied ? (
            <>
              <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              Copied!
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
              </svg>
              Copy
            </>
          )}
        </button>
        <button
          onClick={downloadFile}
          className="flex-1 flex items-center justify-center gap-2 bg-neutral-900 hover:bg-neutral-800 text-white font-medium py-2.5 rounded-xl transition-colors cursor-pointer"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Download
        </button>
      </div>
    </div>
  )
}
