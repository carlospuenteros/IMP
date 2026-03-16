const PIN_HASH_KEY = 'datascrub_pin_hash'
const SESSION_KEY = 'datascrub_session'
const SESSION_DURATION = 30 * 60 * 1000 // 30 minutes

/**
 * Hash a PIN using SHA-256
 */
async function hashPin(pin) {
  const encoder = new TextEncoder()
  const data = encoder.encode(pin + '_datascrub_salt_v1')
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Check if a PIN has been set up
 */
export function isPinSetUp() {
  return localStorage.getItem(PIN_HASH_KEY) !== null
}

/**
 * Set up a new PIN
 */
export async function setupPin(pin) {
  if (pin.length < 4 || pin.length > 8) {
    throw new Error('PIN must be 4-8 digits')
  }
  if (!/^\d+$/.test(pin)) {
    throw new Error('PIN must contain only digits')
  }
  const hash = await hashPin(pin)
  localStorage.setItem(PIN_HASH_KEY, hash)
  createSession()
  return true
}

/**
 * Verify a PIN
 */
export async function verifyPin(pin) {
  const storedHash = localStorage.getItem(PIN_HASH_KEY)
  if (!storedHash) return false
  const hash = await hashPin(pin)
  return hash === storedHash
}

/**
 * Create an authenticated session
 */
function createSession() {
  const session = {
    authenticated: true,
    expiresAt: Date.now() + SESSION_DURATION,
  }
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session))
}

/**
 * Check if user has an active session
 */
export function isAuthenticated() {
  const session = sessionStorage.getItem(SESSION_KEY)
  if (!session) return false
  try {
    const parsed = JSON.parse(session)
    if (parsed.authenticated && parsed.expiresAt > Date.now()) {
      return true
    }
    sessionStorage.removeItem(SESSION_KEY)
    return false
  } catch {
    return false
  }
}

/**
 * Login with PIN
 */
export async function login(pin) {
  const valid = await verifyPin(pin)
  if (valid) {
    createSession()
    return true
  }
  return false
}

/**
 * Logout and clear session
 */
export function logout() {
  sessionStorage.removeItem(SESSION_KEY)
}

/**
 * Reset PIN (clears everything)
 */
export function resetPin() {
  localStorage.removeItem(PIN_HASH_KEY)
  sessionStorage.removeItem(SESSION_KEY)
}
