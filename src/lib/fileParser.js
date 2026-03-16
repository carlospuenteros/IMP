import * as pdfjsLib from 'pdfjs-dist'
import mammoth from 'mammoth'

// Set up PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`

/**
 * Parse a file and return its text content
 * @param {File} file
 * @returns {Promise<string>}
 */
export async function parseFile(file) {
  const extension = file.name.split('.').pop().toLowerCase()

  switch (extension) {
    case 'txt':
    case 'md':
    case 'csv':
    case 'json':
    case 'log':
    case 'xml':
    case 'yaml':
    case 'yml':
    case 'env':
    case 'ini':
    case 'conf':
    case 'cfg':
      return await readAsText(file)

    case 'pdf':
      return await parsePDF(file)

    case 'docx':
      return await parseDOCX(file)

    default:
      // Try reading as text for unknown types
      try {
        return await readAsText(file)
      } catch {
        throw new Error(`Unsupported file type: .${extension}`)
      }
  }
}

function readAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsText(file)
  })
}

async function parsePDF(file) {
  const arrayBuffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
  const pages = []

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()
    const text = content.items.map((item) => item.str).join(' ')
    pages.push(text)
  }

  return pages.join('\n\n')
}

async function parseDOCX(file) {
  const arrayBuffer = await file.arrayBuffer()
  const result = await mammoth.extractRawText({ arrayBuffer })
  return result.value
}

/**
 * Get a human-readable file size
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

/**
 * Accepted file types for input element
 */
export const ACCEPTED_FILE_TYPES =
  '.txt,.md,.csv,.json,.log,.xml,.yaml,.yml,.env,.ini,.conf,.cfg,.pdf,.docx'
