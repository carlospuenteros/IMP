import nlp from 'compromise'
import { faker } from '@faker-js/faker'

// ─── Common Spanish first/last names for contextual detection ───
const SPANISH_FIRST_NAMES = new Set([
  'alejandro','alejandra','andrés','andrea','antonio','ana','beatriz','carlos',
  'carmen','carolina','catalina','claudia','cristina','daniel','david','diego',
  'eduardo','elena','emilio','enrique','ernesto','esteban','eva','felipe',
  'fernando','francisco','gabriel','gabriela','gloria','gonzalo','guadalupe',
  'guillermo','gustavo','héctor','hugo','ignacio','isabel','javier','jesús',
  'joaquín','jorge','josé','josefina','juan','juana','julia','julio','laura',
  'leonardo','leticia','lorena','lucía','luis','manuel','marcela','marco',
  'marcos','margarita','maría','mariana','mario','marta','martín','mercedes',
  'miguel','mónica','natalia','nicolás','ofelia','óscar','pablo','patricia',
  'paula','pedro','pilar','rafael','ramón','raquel','raúl','rebeca','ricardo',
  'roberto','rodrigo','rosa','rosario','salvador','samuel','sandra','santiago',
  'sara','sebastián','sergio','silvia','sofía','susana','teresa','tomás',
  'valentina','verónica','vicente','victoria','virginia','xavier','yolanda',
])

const SPANISH_LAST_NAMES = new Set([
  'aguilar','álvarez','araya','arias','bravo','bustos','camacho','campos',
  'carrillo','castillo','castro','chávez','contreras','córdoba','cortés',
  'cruz','delgado','díaz','domínguez','espinoza','estrada','fernández',
  'figueroa','flores','fuentes','gallegos','garcía','gómez','gonzález',
  'guerrero','gutiérrez','hernández','herrera','ibarra','iglesias','jiménez',
  'juárez','león','leyva','lópez','luna','maldonado','marín','martínez',
  'medina','mejía','mendoza','molina','montoya','morales','moreno','muñoz',
  'navarro','núñez','ochoa','orozco','ortega','ortiz','pacheco','padilla',
  'paredes','peña','peralta','pérez','pineda','portillo','quintero','ramírez',
  'ramos','reyes','ríos','rivera','rodríguez','rojas','romero','rosales',
  'ruiz','salazar','sánchez','sandoval','santana','silva','solís','soto',
  'suárez','torres','trujillo','valdez','valencia','vargas','vásquez','vega',
  'velásquez','vera','villa','villanueva','zamora','zapata','zúñiga',
])

// Name context clues (words that precede a name)
const NAME_CONTEXT_EN = /\b(?:mr|mrs|ms|miss|dr|prof|name|named|called|contact|employee|patient|client|resident|citizen|user|person|individual|applicant|candidate|dear|attn|attention|from|to|signed|by|author|manager|director|supervisor|officer|agent|representative)\b\.?\s*/i
const NAME_CONTEXT_ES = /\b(?:sr|sra|srta|señor|señora|señorita|don|doña|dr|dra|prof|nombre|llamado|llamada|contacto|empleado|empleada|paciente|cliente|residente|ciudadano|ciudadana|usuario|usuaria|persona|solicitante|candidato|candidata|estimado|estimada|atención|de|firmado|por|autor|autora|gerente|director|directora|supervisor|supervisora|agente|representante)\b\.?\s*/i

// Regex patterns for sensitive data detection
const PATTERNS = {
  // ─── PII ───
  email: {
    regex: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g,
    label: 'EMAIL',
    category: 'pii',
  },
  // US phones: (555) 123-4567, +1-555-123-4567, etc.
  phoneUS: {
    regex: /\b(?:\+?1[-.\s]?)?(?:\(?\d{3}\)?[-.\s]?)?\d{3}[-.\s]?\d{4}\b/g,
    label: 'PHONE',
    category: 'pii',
  },
  // Spanish phones: +34 612 345 678, 612 34 56 78, 91 123 45 67
  phoneES: {
    regex: /\b(?:\+?34[-.\s]?)?(?:[6-9]\d{2}[-.\s]?\d{2}[-.\s]?\d{2}[-.\s]?\d{2}|[6-9]\d{2}[-.\s]?\d{3}[-.\s]?\d{3})\b/g,
    label: 'PHONE',
    category: 'pii',
  },
  // Latin American phones: +52 55 1234 5678, +57 311 1234567, +54 11 5678-1234
  phoneLatAm: {
    regex: /\b\+?(?:52|54|55|56|57|58|51|53|506|507|502|503|504|505|591|592|593|595|597|598)[-.\s]?\d{1,4}[-.\s]?\d{3,4}[-.\s]?\d{3,4}\b/g,
    label: 'PHONE',
    category: 'pii',
  },
  ssn: {
    regex: /\b\d{3}[-\s]?\d{2}[-\s]?\d{4}\b/g,
    label: 'SSN',
    category: 'pii',
  },
  // Spanish DNI: 12345678A
  dniES: {
    regex: /\b\d{8}[-\s]?[A-HJ-NP-TV-Z]\b/g,
    label: 'DNI',
    category: 'pii',
  },
  // Spanish NIE: X1234567A
  nieES: {
    regex: /\b[XYZ][-\s]?\d{7}[-\s]?[A-Z]\b/gi,
    label: 'NIE',
    category: 'pii',
  },
  // Mexican CURP
  curpMX: {
    regex: /\b[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z\d]\d\b/g,
    label: 'CURP',
    category: 'pii',
  },
  // Mexican RFC
  rfcMX: {
    regex: /\b[A-ZÑ&]{3,4}\d{6}[A-Z\d]{3}\b/g,
    label: 'RFC',
    category: 'pii',
  },
  // Passport numbers (generic): 1-2 letters + 6-9 digits
  passport: {
    regex: /\b(?:passport|pasaporte|no\.\s*de\s*pasaporte)\s*[:=]?\s*([A-Z]{1,2}\d{6,9})\b/gi,
    label: 'PASSPORT',
    category: 'pii',
    captureGroup: 1,
  },
  // US addresses
  addressEN: {
    regex: /\b\d{1,5}\s[\w\s]{1,30}(?:Street|St|Avenue|Ave|Boulevard|Blvd|Drive|Dr|Lane|Ln|Road|Rd|Court|Ct|Way|Place|Pl|Circle|Cir|Terrace|Ter|Highway|Hwy|Parkway|Pkwy|Square|Sq)\.?\b/gi,
    label: 'ADDRESS',
    category: 'pii',
  },
  // Spanish addresses: Calle Mayor 5, Av. de la Constitución 12, Carrera 7 No. 32
  addressES: {
    regex: /\b(?:Calle|C\/|Cl\.|Avenida|Av\.|Avda\.|Boulevard|Blvd\.|Paseo|Pso\.|Carrera|Cra\.|Carrer|Rambla|Plaza|Pza\.|Plz\.|Camino|Cno\.|Travesía|Ronda|Vía|Alameda|Callejón|Glorieta|Pasaje)\s+[\wáéíóúñüÁÉÍÓÚÑÜ\s,.]{2,40}?\s*(?:No\.?\s*)?\d{1,5}(?:\s*[-,]\s*\d{1,4}[°ºª]?\s*[A-Z]?)?\b/gi,
    label: 'ADDRESS',
    category: 'pii',
  },
  // US ZIP codes
  zipCodeUS: {
    regex: /\b\d{5}(?:-\d{4})?\b/g,
    label: 'ZIP_CODE',
    category: 'pii',
  },
  // Spanish postal codes: 28001, 08080
  zipCodeES: {
    regex: /\b(?:0[1-9]|[1-4]\d|5[0-2])\d{3}\b/g,
    label: 'ZIP_CODE',
    category: 'pii',
    requiresContext: true,
    contextKeywords: /(?:código\s*postal|c\.?\s*p\.?|postal|zip|cp|dirección|domicilio|address)/i,
  },
  // Dates: MM/DD/YYYY (US)
  dateUS: {
    regex: /\b(?:0[1-9]|1[0-2])[\/\-](?:0[1-9]|[12]\d|3[01])[\/\-](?:19|20)\d{2}\b/g,
    label: 'DATE_OF_BIRTH',
    category: 'pii',
  },
  // Dates: DD/MM/YYYY (Spanish / European)
  dateEU: {
    regex: /\b(?:0[1-9]|[12]\d|3[01])[\/\-](?:0[1-9]|1[0-2])[\/\-](?:19|20)\d{2}\b/g,
    label: 'DATE_OF_BIRTH',
    category: 'pii',
  },
  // Dates: YYYY-MM-DD (ISO)
  dateISO: {
    regex: /\b(?:19|20)\d{2}[-\/](?:0[1-9]|1[0-2])[-\/](?:0[1-9]|[12]\d|3[01])\b/g,
    label: 'DATE_OF_BIRTH',
    category: 'pii',
  },
  // Written dates: "January 5, 2024" or "5 de enero de 2024" or "5 de enero, 2024"
  dateWrittenEN: {
    regex: /\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+(?:19|20)\d{2}\b/gi,
    label: 'DATE_OF_BIRTH',
    category: 'pii',
  },
  dateWrittenES: {
    regex: /\b\d{1,2}\s+de\s+(?:enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)(?:\s+(?:de|del)\s+(?:19|20)\d{2})?\b/gi,
    label: 'DATE_OF_BIRTH',
    category: 'pii',
  },
  ipAddress: {
    regex: /\b(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\b/g,
    label: 'IP_ADDRESS',
    category: 'pii',
  },

  // ─── Financial ───
  creditCard: {
    regex: /\b(?:\d{4}[-\s]?){3}\d{4}\b/g,
    label: 'CREDIT_CARD',
    category: 'financial',
  },
  bankAccount: {
    regex: /\b\d{8,17}\b/g,
    label: 'BANK_ACCOUNT',
    category: 'financial',
    requiresContext: true,
    contextKeywords: /(?:account|routing|bank|iban|swift|aba|wire|transfer|deposit|cuenta|bancaria|banco|transferencia|depósito|depósito|número\s*de\s*cuenta|nº?\s*cuenta|no\.?\s*de?\s*cuenta|clabe)/i,
  },
  iban: {
    regex: /\b[A-Z]{2}\d{2}[A-Z0-9]{4}\d{7}(?:[A-Z0-9]?\d{0,16})\b/g,
    label: 'IBAN',
    category: 'financial',
  },
  // Mexican CLABE (18 digits)
  clabeMX: {
    regex: /\b\d{18}\b/g,
    label: 'CLABE',
    category: 'financial',
    requiresContext: true,
    contextKeywords: /(?:clabe|interbancaria|cuenta|bank|banco)/i,
  },

  // ─── Secrets ───
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
    regex: /(?:password|passwd|pwd|contraseña|contrasena|clave|pin\s*de\s*acceso)\s*[:=]\s*["']?([^\s"']{4,})["']?/gi,
    label: 'PASSWORD',
    category: 'secrets',
  },
}

// Generate fake replacement data
function generateFakeData(label) {
  switch (label) {
    case 'EMAIL':
      return faker.internet.email()
    case 'PHONE':
      return faker.phone.number()
    case 'SSN':
      return `${faker.number.int({ min: 100, max: 999 })}-${faker.number.int({ min: 10, max: 99 })}-${faker.number.int({ min: 1000, max: 9999 })}`
    case 'DNI':
      return `${faker.number.int({ min: 10000000, max: 99999999 })}${String.fromCharCode(65 + faker.number.int({ min: 0, max: 22 }))}`
    case 'NIE':
      return `X${faker.number.int({ min: 1000000, max: 9999999 })}${String.fromCharCode(65 + faker.number.int({ min: 0, max: 22 }))}`
    case 'CURP':
      return `XXXX${faker.number.int({ min: 100000, max: 999999 })}HXXXXX00`
    case 'RFC':
      return `XXXX${faker.number.int({ min: 100000, max: 999999 })}XX0`
    case 'PASSPORT':
      return `XX${faker.number.int({ min: 100000, max: 999999 })}`
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
    case 'CLABE':
      return faker.finance.accountNumber(18)
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

// ─── Contextual name detection using name dictionaries ───
function detectNamesByDictionary(text, addFinding) {
  // Match capitalized words (including accented chars)
  const wordPattern = /[A-ZÁÉÍÓÚÑÜ][a-záéíóúñü]+/g
  const words = []
  let m
  while ((m = wordPattern.exec(text)) !== null) {
    words.push({ word: m[0], index: m.index })
  }

  for (let i = 0; i < words.length; i++) {
    const w = words[i]
    const lower = w.word.toLowerCase()
    const isFirst = SPANISH_FIRST_NAMES.has(lower)
    const isLast = SPANISH_LAST_NAMES.has(lower)

    if (!isFirst && !isLast) continue

    // Look for multi-word name sequences: "Juan Carlos García López"
    let endIdx = i
    let nameEnd = w.index + w.word.length

    // Look ahead for more name parts
    for (let j = i + 1; j < words.length && j <= i + 4; j++) {
      const next = words[j]
      // Must be adjacent (allow 1-2 chars gap for spaces, "de", "del", "de la")
      const gap = text.substring(nameEnd, next.index)
      if (!/^\s+(?:de\s+(?:la\s+|los\s+|las\s+)?|del\s+)?$/i.test(gap) && !/^\s+$/.test(gap)) break
      const nextLower = next.word.toLowerCase()
      if (SPANISH_FIRST_NAMES.has(nextLower) || SPANISH_LAST_NAMES.has(nextLower)) {
        endIdx = j
        nameEnd = next.index + next.word.length
      } else {
        break
      }
    }

    // Only flag multi-word names OR single names with context
    const fullName = text.substring(w.index, nameEnd)
    if (endIdx > i) {
      // Multi-word name (2+ recognized parts) — high confidence
      addFinding(w.index, nameEnd, fullName, 'NAME', 'pii')
      i = endIdx // skip consumed words
    } else {
      // Single word — only flag if preceded by a name context clue
      const before = text.substring(Math.max(0, w.index - 60), w.index)
      if (NAME_CONTEXT_EN.test(before) || NAME_CONTEXT_ES.test(before)) {
        addFinding(w.index, nameEnd, fullName, 'NAME', 'pii')
      }
    }
  }
}

/**
 * Detect sensitive data in text using regex patterns + NLP + dictionary
 * Returns array of { start, end, text, label, category }
 */
export function detectSensitiveData(text) {
  const findings = []
  const coveredRanges = []

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
      if (pattern.requiresContext) {
        const contextKeywords = pattern.contextKeywords
        const surroundingText = text.substring(
          Math.max(0, match.index - 80),
          Math.min(text.length, match.index + match[0].length + 80)
        )
        if (!contextKeywords.test(surroundingText)) continue
      }

      const matched = pattern.captureGroup ? match[pattern.captureGroup] : match[0]
      const startIdx = pattern.captureGroup
        ? match.index + match[0].indexOf(matched)
        : match.index
      addFinding(startIdx, startIdx + matched.length, matched, pattern.label, pattern.category)
    }
  }

  // 2. NLP-based detection using compromise.js (English-focused)
  try {
    const doc = nlp(text)

    const people = doc.people().out('array')
    for (const name of people) {
      if (name.length < 3) continue
      let idx = text.indexOf(name)
      while (idx !== -1) {
        addFinding(idx, idx + name.length, name, 'NAME', 'pii')
        idx = text.indexOf(name, idx + 1)
      }
    }

    const orgs = doc.organizations().out('array')
    for (const org of orgs) {
      if (org.length < 2) continue
      let idx = text.indexOf(org)
      while (idx !== -1) {
        addFinding(idx, idx + org.length, org, 'ORGANIZATION', 'pii')
        idx = text.indexOf(org, idx + 1)
      }
    }

    const places = doc.places().out('array')
    for (const place of places) {
      if (place.length < 3) continue
      let idx = text.indexOf(place)
      while (idx !== -1) {
        addFinding(idx, idx + place.length, place, 'LOCATION', 'pii')
        idx = text.indexOf(place, idx + 1)
      }
    }
  } catch (e) {
    console.warn('NLP detection error:', e)
  }

  // 3. Dictionary-based Spanish name detection
  try {
    detectNamesByDictionary(text, addFinding)
  } catch (e) {
    console.warn('Dictionary name detection error:', e)
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

  const anonymizeMap = new Map()

  for (const finding of findings) {
    result += text.substring(lastIndex, finding.start)

    if (mode === 'redact') {
      result += `[${finding.label}]`
    } else {
      if (!anonymizeMap.has(finding.text)) {
        anonymizeMap.set(finding.text, generateFakeData(finding.label))
      }
      result += anonymizeMap.get(finding.text)
    }

    if (!summary[finding.label]) {
      summary[finding.label] = { count: 0, category: finding.category }
    }
    summary[finding.label].count++

    lastIndex = finding.end
  }

  result += text.substring(lastIndex)

  return { scrubbed: result, summary }
}
