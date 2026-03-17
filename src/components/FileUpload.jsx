import { useCallback, useState } from 'react'
import { parseFile, ACCEPTED_FILE_TYPES, formatFileSize } from '../lib/fileParser'

export default function FileUpload({ onFileContent, onTextInput, textValue }) {
  const [dragActive, setDragActive] = useState(false)
  const [fileName, setFileName] = useState('')
  const [fileSize, setFileSize] = useState('')
  const [parsing, setParsing] = useState(false)
  const [error, setError] = useState('')

  const handleFile = useCallback(
    async (file) => {
      if (!file) return
      setParsing(true)
      setError('')
      setFileName(file.name)
      setFileSize(formatFileSize(file.size))

      try {
        const content = await parseFile(file)
        onFileContent(content)
      } catch (err) {
        setError(err.message)
        setFileName('')
        setFileSize('')
      }
      setParsing(false)
    },
    [onFileContent]
  )

  function handleDrop(e) {
    e.preventDefault()
    setDragActive(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  function handleDrag(e) {
    e.preventDefault()
    setDragActive(e.type === 'dragenter' || e.type === 'dragover')
  }

  return (
    <div className="space-y-5">
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-1.5">
          Paste your text
        </label>
        <textarea
          value={textValue}
          onChange={(e) => onTextInput(e.target.value)}
          placeholder="Paste text containing sensitive data here..."
          rows={10}
          className="w-full border border-neutral-300 rounded-xl px-4 py-3 text-neutral-900 text-sm font-mono resize-y focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 placeholder-neutral-400 transition-colors"
        />
      </div>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-neutral-200"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-3 bg-white text-neutral-400">or upload a file</span>
        </div>
      </div>

      <div
        onDrop={handleDrop}
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer ${
          dragActive
            ? 'border-neutral-900 bg-neutral-50'
            : 'border-neutral-300 hover:border-neutral-400'
        }`}
      >
        <input
          type="file"
          accept={ACCEPTED_FILE_TYPES}
          onChange={(e) => handleFile(e.target.files[0])}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />

        {parsing ? (
          <div className="text-neutral-600">
            <svg className="w-7 h-7 mx-auto mb-2 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <p className="text-sm">Parsing {fileName}...</p>
          </div>
        ) : fileName && !error ? (
          <div className="text-neutral-700">
            <svg className="w-7 h-7 mx-auto mb-2 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm font-medium">{fileName}</p>
            <p className="text-xs text-neutral-400 mt-0.5">{fileSize}</p>
          </div>
        ) : (
          <div className="text-neutral-400">
            <svg className="w-7 h-7 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p className="text-sm text-neutral-600">Drop a file here or click to browse</p>
            <p className="text-xs mt-1 text-neutral-400">
              .txt, .csv, .json, .md, .pdf, .docx and more
            </p>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}
    </div>
  )
}
