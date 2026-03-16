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
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-600/20 mb-4">
            <svg className="w-8 h-8 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white mb-1">DataScrub</h1>
          <p className="text-gray-400 text-sm">
            {isSetup ? 'Create a PIN to protect your session' : 'Enter your PIN to continue'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-gray-900 rounded-xl p-6 border border-gray-800">
          <div className="mb-4">
            <label className="block text-sm text-gray-400 mb-2">
              {isSetup ? 'Create PIN (4-8 digits)' : 'Enter PIN'}
            </label>
            <input
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={8}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white text-center text-2xl tracking-[0.5em] focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              placeholder="****"
              autoFocus
            />
          </div>

          {isSetup && (
            <div className="mb-4">
              <label className="block text-sm text-gray-400 mb-2">Confirm PIN</label>
              <input
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={8}
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white text-center text-2xl tracking-[0.5em] focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                placeholder="****"
              />
            </div>
          )}

          {error && (
            <p className="text-red-400 text-sm mb-4 text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || pin.length < 4}
            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-700 disabled:text-gray-500 text-white font-medium py-3 rounded-lg transition-colors"
          >
            {loading ? 'Please wait...' : isSetup ? 'Create PIN' : 'Unlock'}
          </button>
        </form>

        <p className="text-gray-600 text-xs text-center mt-4">
          Your PIN is stored securely as a hash in your browser.
        </p>
      </div>
    </div>
  )
}
