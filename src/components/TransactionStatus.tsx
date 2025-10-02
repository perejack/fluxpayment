import { useEffect, useState } from 'react'
import { CheckCircle, XCircle, Loader2, RefreshCw, Clock } from 'lucide-react'
import type { Transaction } from '../App'

interface TransactionStatusProps {
  transaction: Transaction
  onReset: () => void
  onStatusUpdate: (transaction: Transaction) => void
}

export default function TransactionStatus({ 
  transaction, 
  onReset,
  onStatusUpdate
}: TransactionStatusProps) {
  const [checking, setChecking] = useState(false)
  const [countdown, setCountdown] = useState(60)

  useEffect(() => {
    if (transaction.status === 'pending') {
      // Start polling for status
      const pollInterval = setInterval(() => {
        checkTransactionStatus()
      }, 5000) // Check every 5 seconds

      // Countdown timer
      const countdownInterval = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(countdownInterval)
            return 0
          }
          return prev - 1
        })
      }, 1000)

      // Stop polling after 2 minutes
      const timeout = setTimeout(() => {
        clearInterval(pollInterval)
        clearInterval(countdownInterval)
        if (transaction.status === 'pending') {
          onStatusUpdate({
            ...transaction,
            status: 'failed',
            message: 'Transaction timeout. Please try again.',
          })
        }
      }, 120000)

      return () => {
        clearInterval(pollInterval)
        clearInterval(countdownInterval)
        clearTimeout(timeout)
      }
    }
  }, [transaction.status])

  const checkTransactionStatus = async () => {
    if (checking) return
    
    setChecking(true)
    try {
      const response = await fetch('/.netlify/functions/check-status-db', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          api_key: 'PSFXyLBOrRV9',
          email: 'frankyfreaky103@gmail.com', // Email registered with PesaFlux account
          transaction_request_id: transaction.transactionId,
        }),
      })

      const data = await response.json()

      console.log('Transaction status response:', data) // Debug log

      // Check for success
      if (data.ResultCode === "200" || data.ResultCode === 200 || data.TransactionStatus === "Completed") {
        onStatusUpdate({
          ...transaction,
          status: 'success',
          message: 'Payment completed successfully!',
          receipt: data.TransactionReceipt,
          responseCode: parseInt(data.ResultCode || data.TransactionCode || 0),
        })
      } else if (data.ResultCode || data.TransactionCode) {
        // Check for cancellation response codes
        const resultCode = data.ResultCode || data.TransactionCode
        const resultDesc = data.ResultDesc || data.TransactionStatus || ''
        
        const isCancelled = 
          resultCode === "1032" || resultCode === 1032 ||  // Request cancelled by user
          resultCode === "1031" || resultCode === 1031 ||  // Request cancelled
          resultCode === "1" || resultCode === 1 ||        // Insufficient funds (sometimes user cancels)
          resultDesc.toLowerCase().includes('cancel') ||
          resultDesc.toLowerCase().includes('cancelled')

        if (isCancelled) {
          onStatusUpdate({
            ...transaction,
            status: 'cancelled',
            message: resultDesc || 'Payment was cancelled',
            responseCode: parseInt(resultCode),
          })
        } else {
          onStatusUpdate({
            ...transaction,
            status: 'failed',
            message: resultDesc || 'Payment failed',
            responseCode: parseInt(resultCode),
          })
        }
      }
    } catch (error) {
      console.error('Status check error:', error)
    } finally {
      setChecking(false)
    }
  }

  const getStatusIcon = () => {
    switch (transaction.status) {
      case 'success':
        return <CheckCircle className="w-16 h-16 text-green-500" />
      case 'failed':
        return <XCircle className="w-16 h-16 text-red-500" />
      case 'cancelled':
        return <XCircle className="w-16 h-16 text-orange-500" />
      case 'pending':
        return <Loader2 className="w-16 h-16 text-primary-500 animate-spin" />
    }
  }

  const getStatusColor = () => {
    switch (transaction.status) {
      case 'success':
        return 'text-green-400'
      case 'failed':
        return 'text-red-400'
      case 'cancelled':
        return 'text-orange-400'
      case 'pending':
        return 'text-primary-400'
    }
  }

  const getStatusTitle = () => {
    switch (transaction.status) {
      case 'success':
        return 'Payment Successful!'
      case 'failed':
        return 'Payment Failed'
      case 'cancelled':
        return 'Payment Cancelled'
      case 'pending':
        return 'Processing Payment'
    }
  }

  return (
    <div className="space-y-6">
      {/* Status Icon */}
      <div className="flex justify-center">
        {getStatusIcon()}
      </div>

      {/* Status Title */}
      <div className="text-center">
        <h2 className={`text-2xl font-bold ${getStatusColor()} mb-2`}>
          {getStatusTitle()}
        </h2>
        <p className="text-gray-400">{transaction.message}</p>
      </div>

      {/* Transaction Details */}
      <div className="bg-gray-700/30 rounded-lg p-4 space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-gray-400 text-sm">Transaction ID</span>
          <span className="text-white text-sm font-mono">
            {transaction.transactionId.slice(0, 20)}...
          </span>
        </div>
        
        {transaction.amount && (
          <div className="flex justify-between items-center">
            <span className="text-gray-400 text-sm">Amount</span>
            <span className="text-white font-semibold">
              KES {transaction.amount.toFixed(2)}
            </span>
          </div>
        )}

        {transaction.phone && (
          <div className="flex justify-between items-center">
            <span className="text-gray-400 text-sm">Phone Number</span>
            <span className="text-white text-sm">
              {transaction.phone}
            </span>
          </div>
        )}

        {transaction.receipt && (
          <div className="flex justify-between items-center">
            <span className="text-gray-400 text-sm">Receipt Number</span>
            <span className="text-green-400 font-semibold">
              {transaction.receipt}
            </span>
          </div>
        )}

        {transaction.status === 'pending' && countdown > 0 && (
          <div className="flex justify-between items-center pt-2 border-t border-gray-600">
            <span className="text-gray-400 text-sm flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Waiting for confirmation
            </span>
            <span className="text-primary-400 font-semibold">
              {countdown}s
            </span>
          </div>
        )}
      </div>

      {/* Instructions for cancelled */}
      {transaction.status === 'cancelled' && (
        <div className="bg-orange-500/10 border border-orange-500/50 rounded-lg p-4">
          <p className="text-sm text-orange-300 text-center">
            Payment was cancelled. You can try again with the same or different details.
          </p>
        </div>
      )}

      {/* Instructions for failed */}
      {transaction.status === 'failed' && (
        <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4">
          <p className="text-sm text-red-300 text-center">
            Payment failed. Please check your M-Pesa balance and try again.
          </p>
        </div>
      )}

      {/* Instructions for pending */}
      {transaction.status === 'pending' && (
        <div className="bg-primary-500/10 border border-primary-500/50 rounded-lg p-4">
          <p className="text-sm text-primary-300 text-center">
            Please check your phone and enter your M-Pesa PIN to complete the payment
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="space-y-3">
        {transaction.status === 'pending' && (
          <button
            onClick={checkTransactionStatus}
            disabled={checking}
            className="w-full bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 text-white font-semibold py-3 px-4 rounded-lg transition duration-200 flex items-center justify-center space-x-2"
          >
            {checking ? (
              <>
                <Loader2 className="animate-spin h-5 w-5" />
                <span>Checking...</span>
              </>
            ) : (
              <>
                <RefreshCw className="h-5 w-5" />
                <span>Check Status</span>
              </>
            )}
          </button>
        )}

        <button
          onClick={onReset}
          className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-4 rounded-lg transition duration-200"
        >
          {transaction.status === 'success' ? 'Make Another Payment' :
           transaction.status === 'cancelled' ? 'Try Again' : 'Try Again'}
        </button>
      </div>
    </div>
  )
}
