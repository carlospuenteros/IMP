import nlp from 'compromise'
import { faker } from '@faker-js/faker'

// Regex patterns for sensitive data detection
const PATTERNS = {
  // PII
  email: {
    regex: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
    label: 'EMAIL',
    category: 'pii',
  },
  phone: {
    regex: /\b(?:\+?1[-.\s]?)?(?:\(?\d{3}\)?[-.\s]?)?\d{3}[-.\s]?\d{4}\b/g,
    label: 'PHONE',
    category: 'pii',
  },
  ssn: {
    regex: /\b\d{3}[-\s]?\d{2}[-\s]?\d{4}\b/g,
    label: 'SSN',
    category: 'pii',
  },
  address: {
    regex: /\b\d{1,5}\s[\w\s]{1,30}(?:Street|St|Avenue|Ave|Boulevard|Blvd|Drive|Dr|Lane|Ln|Road|Rd|Court|Ct|Way|Place|Pl)\.?\b/gi,
    label: 'ADDRESS',
    category: 'pii',
  },
  zipCode: {
    regex: /\b\d{5}(?:-\d{4})?\b/g,
    label: 'ZIP_CODE',
    category: 'pii',
  },
  dateOfBirth: {
    regex: /\b(?:0[1-9]|1[0-2])[\/\-](?:0[1-9]|[12]\d|3[01])[\/\-](?:19|20)\d{2}\b/g,
    label: 'DATE_OF_BIRTH',
    category: 'pii',
  },
  ipAddress: {
    regex: /\b(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\b/g,
    label: 'IP_ADDRESS',
    category: 'pii',
  },

  // Financial
  creditCard: {
    regex: /\b(?:\d{4}[-\s]?){3}\d{4}\b/g,
    label: 'CREDIT_CARD',
    category: 'financial',
  },
  bankAccount: {
    regex: /\b\d{8,17}\b/g,
    label: 'BANK_ACCOUNT',
    category: 'financial',
    requiresContext: true, // Only match near financial keywords
  },
  iban: {
    regex: /\b[A-Z]{2}\d{2}[A-Z0-9]{4}\d{7}(?:[A-Z0-9]?\d{0,16})\b/g,
    label: 'IBAN',
    category: 'financial',
  },

  // Secrets
  apiKey: {
    regex: /\b(?:sk|pk|api|key|token|secret|password|bearer)[-_]?[A-Za-z0-9]{16,64}\b/gi,
    label: 'API_KEY',
    category: 'secrets',
  },
  awsKey: {
    regex: /\b(?:AKIA|ABIA|ACCA|ASIA)[A-Z0-9]{16}\b/g,
    label: 'AWS_KEY',
    category: 'secrets',
  },
  jwtToken: {
    regex: /\beyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g,
    label: 'JWT_TOKEN',
    category: 'secrets',
  },
  privateKey: {
    regex: /-----BEGIN (?:RSA |EC |DSA )?PRIVATE KEY-----[\s\S]*?-----END (?:RSA |EC |DSA )?PRIVATE KEY-----/g,
    label: 'PRIVATE_KEY',
    category: 'secrets',
  },
  genericPassword: {
    regex: /(?:password|passwd|pwd)\s*[:=]\s*["']?([^\s"']{4,})["']?/gi,
    label: 'PASSWORD',
    category: 'secrets',
  },
}

// Financial context keywords for bank account detection
const FINANCIAL_KEYWORDS = /(?:account|routing|bank|iban|swift|aba|wire|transfer|deposit)/i

// Generate fake replacement data
function generateFakeData(label) {
  switch (label) {
    case 'EMAIL':
      return faker.internet.email()
    case 'PHONE':
      return faker.phone.number()
    case 'SSN':
      return `${faker.number.int({ min: 100, max: 999 })}-${faker.number.int({ min: 10, max: 99 })}-${faker.number.int({ min: 1000, max: 9999 })}`
    case 'ADDRESS':
      return faker.location.streetAddress()
    case 'ZIP_CODE':
      return faker.location.zipCode()
    case 'DATE_OF_BIRTH':
      return faker.date.birthdate().toLocaleDateString('en-US')
    case 'IP_ADDRESS':
      return faker.internet.ipv4()
    case 'CREDIT_CARD':
      return `${faker.number.int({ min: 4000, max: 4999 })}-****-****-${faker.number.int({ min: 1000, max: 9999 })}`
    case 'BANK_ACCOUNT':
      return faker.finance.accountNumber()
    case 'IBAN':
      return faker.finance.iban()
    case 'NAME':
      return faker.person.fullName()
    case 'FIRST_NAME':
      return faker.person.firstName()
    case 'LAST_NAME':
      return faker.person.lastName()
    case 'ORGANIZATION':
      return faker.company.name()
    default:
      return `[REDACTED_${label}]`
  }
}

/**
 * Detect sensitive data in text using regex patterns + NLP
 * Returns array of { start, end, text, label, category }
 */
export function detectSensitiveData(text) {
  const findings = []
  const coveredRanges = []

  // Helper to check if a range overlaps with existing findings
  function isOverlapping(start, end) {
    return coveredRanges.some(
      (r) => (start >= r.start && start < r.end) || (end > r.start && end <= r.end)
    )
  }

  function addFinding(start, end, matchedText, label, category) {
    if (!isOverlapping(start, end)) {
      findings.push({ start, end, text: matchedText, label, category })
      coveredRanges.push({ start, end })
    }
  }

  // 1. Regex-based detection
  for (const [, pattern] of Object.entries(PATTERNS)) {
    const regex = new RegExp(pattern.regex.source, pattern.regex.flags)
    let match
    while ((match = regex.exec(text)) !== null) {
      // For bank accounts, require financial context nearby
      if (pattern.requiresContext) {
        const surroundingText = text.substring(
          Math.max(0, match.index - 50),
          Math.min(text.length, match.index + match[0].length + 50)
        )
        if (!FINANCIAL_KEYWORDS.test(surroundingText)) continue
      }
      addFinding(match.index, match.index + match[0].length, match[0], pattern.label, pattern.category)
    }
  }

  // 2. NLP-based detection using compromise.js
  try {
    const doc = nlp(text)

    // Detect person names
    const people = doc.people().out('array')
    for (const name of people) {
      let idx = text.indexOf(name)
      while (idx !== -1) {
        addFinding(idx, idx + name.length, name, 'NAME', 'pii')
        idx = text.indexOf(name, idx + 1)
      }
    }

    // Detect organization names
    const orgs = doc.organizations().out('array')
    for (const org of orgs) {
      let idx = text.indexOf(org)
      while (idx !== -1) {
        addFinding(idx, idx + org.length, org, 'ORGANIZATION', 'pii')
        idx = text.indexOf(org, idx + 1)
      }
    }

    // Detect place names
    const places = doc.places().out('array')
    for (const place of places) {
      let idx = text.indexOf(place)
      while (idx !== -1) {
        addFinding(idx, idx + place.length, place, 'LOCATION', 'pii')
        idx = text.indexOf(place, idx + 1)
      }
    }
  } catch (e) {
    console.warn('NLP detection error:', e)
  }

  // Sort by position
  findings.sort((a, b) => a.start - b.start)
  return findings
}

/**
 * Scrub text by replacing detected sensitive data
 * @param {string} text - Input text
 * @param {Array} findings - Detected sensitive data
 * @param {'redact'|'anonymize'} mode - Scrub mode
 * @returns {{ scrubbed: string, summary: Object }}
 */
export function scrubText(text, findings, mode = 'redact') {
  if (findings.length === 0) return { scrubbed: text, summary: {} }

  const summary = {}
  let result = ''
  let lastIndex = 0

  // Build a consistent mapping for anonymize mode
  const anonymizeMap = new Map()

  for (const finding of findings) {
    result += text.substring(lastIndex, finding.start)

    if (mode === 'redact') {
      result += `[${finding.label}]`
    } else {
      // Anonymize: use consistent fake data for same original values
      if (!anonymizeMap.has(finding.text)) {
        anonymizeMap.set(finding.text, generateFakeData(finding.label))
      }
      result += anonymizeMap.get(finding.text)
    }

    // Update summary
    if (!summary[finding.label]) {
      summary[finding.label] = { count: 0, category: finding.category }
    }
    summary[finding.label].count++

    lastIndex = finding.end
  }

  result += text.substring(lastIndex)

  return { scrubbed: result, summary }
}
