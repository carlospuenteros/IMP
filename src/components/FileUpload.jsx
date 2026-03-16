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
    <div className="space-y-4">
      {/* Text area input */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Paste your text
        </label>
        <textarea
          value={textValue}
          onChange={(e) => onTextInput(e.target.value)}
          placeholder="Paste text containing sensitive data here..."
          rows={10}
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-gray-200 text-sm font-mono resize-y focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 placeholder-gray-600"
        />
      </div>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-800"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-3 bg-gray-900 text-gray-500">or upload a file</span>
        </div>
      </div>

      {/* File upload zone */}
      <div
        onDrop={handleDrop}
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
          dragActive
            ? 'border-indigo-500 bg-indigo-500/10'
            : 'border-gray-700 hover:border-gray-600'
        }`}
      >
        <input
          type="file"
          accept={ACCEPTED_FILE_TYPES}
          onChange={(e) => handleFile(e.target.files[0])}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />

        {parsing ? (
          <div className="text-indigo-400">
            <svg className="w-8 h-8 mx-auto mb-2 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <p className="text-sm">Parsing {fileName}...</p>
          </div>
        ) : fileName && !error ? (
          <div className="text-green-400">
            <svg className="w-8 h-8 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm font-medium">{fileName}</p>
            <p className="text-xs text-gray-500">{fileSize}</p>
          </div>
        ) : (
          <div className="text-gray-500">
            <svg className="w-8 h-8 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p className="text-sm">Drop a file here or click to browse</p>
            <p className="text-xs mt-1 text-gray-600">
              .txt, .csv, .json, .md, .pdf, .docx and more
            </p>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}
    </div>
  )
}
