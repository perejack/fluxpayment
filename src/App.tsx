import { useState } from 'react'
import PaymentForm from './components/PaymentForm'
import TransactionStatus from './components/TransactionStatus'
import { Smartphone } from 'lucide-react'

export interface Transaction {
  transactionId: string
  status: 'pending' | 'success' | 'failed' | 'cancelled'
  message: string
  amount?: number
  phone?: string
  receipt?: string
  responseCode?: number
}

function App() {
  const [transaction, setTransaction] = useState<Transaction | null>(null)

  const handlePaymentInitiated = (transactionData: Transaction) => {
    setTransaction(transactionData)
  }

  const handleReset = () => {
    setTransaction(null)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-primary-600 p-4 rounded-full">
              <Smartphone className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            M-Pesa Payment
          </h1>
          <p className="text-gray-400">
            Secure payment powered by PesaFlux
          </p>
        </div>

        {/* Main Content */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-700 p-6">
          {!transaction ? (
            <PaymentForm onPaymentInitiated={handlePaymentInitiated} />
          ) : (
            <TransactionStatus 
              transaction={transaction} 
              onReset={handleReset}
              onStatusUpdate={setTransaction}
            />
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-6 text-sm text-gray-500">
          <p>Powered by PesaFlux API</p>
        </div>
      </div>
    </div>
  )
}

export default App
