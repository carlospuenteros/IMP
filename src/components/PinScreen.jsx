import { useState } from 'react'
import { isPinSetUp, setupPin, login } from '../lib/pinAuth'

export default function PinScreen({ onAuthenticated }) {
  const [pin, setPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const isSetup = !isPinSetUp()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (isSetup) {
        if (pin !== confirmPin) {
          setError('PINs do not match')
          setLoading(false)
          return
        }
        await setupPin(pin)
        onAuthenticated()
      } else {
        const success = await login(pin)
        if (success) {
          onAuthenticated()
        } else {
          setError('Incorrect PIN')
        }
      }
    } catch (err) {
      setError(err.message)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full border border-neutral-200 mb-5">
            <svg className="w-6 h-6 text-neutral-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-2xl font-semibold text-neutral-900 mb-1 tracking-tight">DataScrub</h1>
          <p className="text-neutral-500 text-sm">
            {isSetup ? 'Create a PIN to protect your session' : 'Enter your PIN to continue'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">
              {isSetup ? 'Create PIN (4-8 digits)' : 'PIN'}
            </label>
            <input
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={8}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
              className="w-full border border-neutral-300 rounded-xl px-4 py-3 text-neutral-900 text-center text-2xl tracking-[0.5em] focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 placeholder-neutral-300 transition-colors"
              placeholder="----"
              autoFocus
            />
          </div>

          {isSetup && (
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">Confirm PIN</label>
              <input
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={8}
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                className="w-full border border-neutral-300 rounded-xl px-4 py-3 text-neutral-900 text-center text-2xl tracking-[0.5em] focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 placeholder-neutral-300 transition-colors"
                placeholder="----"
              />
            </div>
          )}

          {error && (
            <p className="text-red-600 text-sm text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || pin.length < 4}
            className="w-full bg-neutral-900 hover:bg-neutral-800 disabled:bg-neutral-200 disabled:text-neutral-400 text-white font-medium py-3 rounded-xl transition-colors cursor-pointer"
          >
            {loading ? 'Please wait...' : isSetup ? 'Create PIN' : 'Unlock'}
          </button>
        </form>

        <p className="text-neutral-400 text-xs text-center mt-6">
          Your PIN is stored as a hash in your browser.
        </p>
      </div>
    </div>
  )
}
