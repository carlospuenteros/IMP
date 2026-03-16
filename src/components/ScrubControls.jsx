export default function ScrubControls({ mode, onModeChange, onScrub, disabled, findings }) {
  const categoryColors = {
    pii: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    financial: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    secrets: 'bg-red-500/20 text-red-400 border-red-500/30',
  }

  const summaryByCategory = findings.reduce((acc, f) => {
    acc[f.category] = (acc[f.category] || 0) + 1
    return acc
  }, {})

  return (
    <div className="space-y-4">
      {/* Mode selector */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Scrub Mode
        </label>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => onModeChange('redact')}
            className={`px-4 py-3 rounded-lg border text-sm font-medium transition-colors ${
              mode === 'redact'
                ? 'bg-indigo-600/20 border-indigo-500 text-indigo-400'
                : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600'
            }`}
          >
            <div className="font-semibold">Redact</div>
            <div className="text-xs mt-0.5 opacity-70">Replace with [LABELS]</div>
          </button>
          <button
            onClick={() => onModeChange('anonymize')}
            className={`px-4 py-3 rounded-lg border text-sm font-medium transition-colors ${
              mode === 'anonymize'
                ? 'bg-indigo-600/20 border-indigo-500 text-indigo-400'
                : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600'
            }`}
          >
            <div className="font-semibold">Anonymize</div>
            <div className="text-xs mt-0.5 opacity-70">Replace with fake data</div>
          </button>
        </div>
      </div>

      {/* Detection summary */}
      {findings.length > 0 && (
        <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/50">
          <h3 className="text-sm font-medium text-gray-300 mb-3">
            Detected {findings.length} sensitive item{findings.length !== 1 ? 's' : ''}
          </h3>
          <div className="flex flex-wrap gap-2">
            {Object.entries(summaryByCategory).map(([category, count]) => (
              <span
                key={category}
                className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium border ${categoryColors[category] || 'bg-gray-700 text-gray-300 border-gray-600'}`}
              >
                {category.toUpperCase()}: {count}
              </span>
            ))}
          </div>
          <div className="mt-3 space-y-1">
            {findings.slice(0, 10).map((f, i) => (
              <div key={i} className="flex items-center text-xs gap-2">
                <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-mono border ${categoryColors[f.category]}`}>
                  {f.label}
                </span>
                <span className="text-gray-500 font-mono truncate">
                  {f.text.length > 30 ? f.text.substring(0, 30) + '...' : f.text}
                </span>
              </div>
            ))}
            {findings.length > 10 && (
              <p className="text-xs text-gray-600">...and {findings.length - 10} more</p>
            )}
          </div>
        </div>
      )}

      {/* Scrub button */}
      <button
        onClick={onScrub}
        disabled={disabled}
        className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-700 disabled:text-gray-500 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
        Scrub Data
      </button>
    </div>
  )
}
