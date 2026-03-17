export default function ScrubControls({ mode, onModeChange, onScrub, disabled, findings }) {
  const categoryLabels = {
    pii: 'Personal',
    financial: 'Financial',
    secrets: 'Secrets',
  }

  const summaryByCategory = findings.reduce((acc, f) => {
    acc[f.category] = (acc[f.category] || 0) + 1
    return acc
  }, {})

  return (
    <div className="space-y-5">
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          Mode
        </label>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => onModeChange('redact')}
            className={`px-4 py-3 rounded-xl border text-sm transition-all cursor-pointer ${
              mode === 'redact'
                ? 'border-neutral-900 bg-neutral-900 text-white'
                : 'border-neutral-300 text-neutral-600 hover:border-neutral-400'
            }`}
          >
            <div className="font-medium">Redact</div>
            <div className="text-xs mt-0.5 opacity-60">Replace with [LABELS]</div>
          </button>
          <button
            onClick={() => onModeChange('anonymize')}
            className={`px-4 py-3 rounded-xl border text-sm transition-all cursor-pointer ${
              mode === 'anonymize'
                ? 'border-neutral-900 bg-neutral-900 text-white'
                : 'border-neutral-300 text-neutral-600 hover:border-neutral-400'
            }`}
          >
            <div className="font-medium">Anonymize</div>
            <div className="text-xs mt-0.5 opacity-60">Replace with fake data</div>
          </button>
        </div>
      </div>

      {findings.length > 0 && (
        <div className="rounded-xl border border-neutral-200 p-4">
          <h3 className="text-sm font-medium text-neutral-900 mb-3">
            {findings.length} item{findings.length !== 1 ? 's' : ''} detected
          </h3>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {Object.entries(summaryByCategory).map(([category, count]) => (
              <span
                key={category}
                className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-neutral-100 text-neutral-700"
              >
                {categoryLabels[category] || category}: {count}
              </span>
            ))}
          </div>
          <div className="space-y-1.5">
            {findings.slice(0, 8).map((f, i) => (
              <div key={i} className="flex items-center text-xs gap-2">
                <span className="inline-block px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-500 text-[10px] font-mono shrink-0">
                  {f.label}
                </span>
                <span className="text-neutral-400 font-mono truncate">
                  {f.text.length > 28 ? f.text.substring(0, 28) + '...' : f.text}
                </span>
              </div>
            ))}
            {findings.length > 8 && (
              <p className="text-xs text-neutral-400">+{findings.length - 8} more</p>
            )}
          </div>
        </div>
      )}

      <button
        onClick={onScrub}
        disabled={disabled}
        className="w-full bg-neutral-900 hover:bg-neutral-800 disabled:bg-neutral-200 disabled:text-neutral-400 text-white font-medium py-3 rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
        Scrub Data
      </button>
    </div>
  )
}
