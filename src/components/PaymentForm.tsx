import { useState } from 'react'
import { Loader2, CreditCard, Phone, DollarSign } from 'lucide-react'
import type { Transaction } from '../App'

interface PaymentFormProps {
  onPaymentInitiated: (transaction: Transaction) => void
}

export default function PaymentForm({ onPaymentInitiated }: PaymentFormProps) {
  const [phoneNumber, setPhoneNumber] = useState('')
  const [amount, setAmount] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const formatPhoneNumber = (value: string) => {
    // Remove all non-numeric characters
    const cleaned = value.replace(/\D/g, '')
    
    // If starts with 0, replace with 254
    if (cleaned.startsWith('0')) {
      return '254' + cleaned.slice(1)
    }
    
    // If starts with +254, remove the +
    if (cleaned.startsWith('254')) {
      return cleaned
    }
    
    // If starts with just the number without country code
    if (cleaned.length === 9) {
      return '254' + cleaned
    }
    
    return cleaned
  }

  const validateForm = () => {
    if (!phoneNumber || !amount || !email) {
      setError('All fields are required')
      return false
    }

    const formattedPhone = formatPhoneNumber(phoneNumber)
    if (formattedPhone.length !== 12 || !formattedPhone.startsWith('254')) {
      setError('Invalid phone number. Use format: 0712345678 or 254712345678')
      return false
    }

    const amountNum = parseFloat(amount)
    if (isNaN(amountNum) || amountNum < 1) {
      setError('Amount must be at least KES 1')
      return false
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setError('Invalid email address')
      return false
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!validateForm()) {
      return
    }

    setLoading(true)

    try {
      const formattedPhone = formatPhoneNumber(phoneNumber)
      const reference = `PAY${Date.now()}`

      const response = await fetch('/.netlify/functions/initiate-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          msisdn: formattedPhone,
          amount: parseFloat(amount),
          email: email,
          reference: reference,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Payment initiation failed')
      }

      if (data.success === '200' || data.success === 200) {
        onPaymentInitiated({
          transactionId: data.transaction_request_id,
          status: 'pending',
          message: 'Check your phone for M-Pesa prompt',
          amount: parseFloat(amount),
          phone: formattedPhone,
        })
      } else {
        throw new Error(data.massage || data.message || 'Payment initiation failed')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
          Email Address
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <CreditCard className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="block w-full pl-10 pr-3 py-3 border border-gray-600 rounded-lg bg-gray-700/50 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
            placeholder="your@email.com"
            disabled={loading}
          />
        </div>
      </div>

      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-gray-300 mb-2">
          M-Pesa Phone Number
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Phone className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="tel"
            id="phone"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            className="block w-full pl-10 pr-3 py-3 border border-gray-600 rounded-lg bg-gray-700/50 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
            placeholder="0712345678 or 254712345678"
            disabled={loading}
          />
        </div>
        <p className="mt-1 text-xs text-gray-400">
          Enter your Safaricom number
        </p>
      </div>

      <div>
        <label htmlFor="amount" className="block text-sm font-medium text-gray-300 mb-2">
          Amount (KES)
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <DollarSign className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="number"
            id="amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="block w-full pl-10 pr-3 py-3 border border-gray-600 rounded-lg bg-gray-700/50 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
            placeholder="100"
            min="1"
            step="1"
            disabled={loading}
          />
        </div>
        <p className="mt-1 text-xs text-gray-400">
          Minimum amount: KES 1
        </p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition duration-200 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl"
      >
        {loading ? (
          <>
            <Loader2 className="animate-spin h-5 w-5" />
            <span>Processing...</span>
          </>
        ) : (
          <>
            <CreditCard className="h-5 w-5" />
            <span>Pay with M-Pesa</span>
          </>
        )}
      </button>

      <div className="text-center text-xs text-gray-400">
        <p>You will receive an M-Pesa prompt on your phone</p>
        <p className="mt-1">Enter your PIN to complete the payment</p>
      </div>
    </form>
  )
}
