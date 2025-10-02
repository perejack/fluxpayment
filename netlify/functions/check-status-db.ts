import { Handler, HandlerEvent, HandlerContext } from '@netlify/functions'
import { supabase } from './supabase'

interface StatusRequest {
  api_key: string
  email: string
  transaction_request_id: string
}

const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  }

  // Handle preflight request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    }
  }

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    }
  }

  try {
    // Parse request body
    const body: StatusRequest = JSON.parse(event.body || '{}')
    const { api_key, email, transaction_request_id } = body

    // Validate required fields
    if (!api_key || !email || !transaction_request_id) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Missing required fields: api_key, email, transaction_request_id'
        }),
      }
    }

    // API key hardcoded for deployment
    const apiKey = 'PSFXyLBOrRV9'

    console.log('Checking transaction status in database:', transaction_request_id)

    // Query database for transaction status
    const { data: transaction, error: dbError } = await supabase
      .from('transactions')
      .select('*')
      .eq('transaction_request_id', transaction_request_id)
      .single()

    if (dbError) {
      console.error('Database query error:', dbError)
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({
          error: 'Transaction not found'
        }),
      }
    }

    // Return the status data
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        ResultCode: transaction.status === 'success' ? '200' : (transaction.status === 'cancelled' ? '1032' : '1'),
        ResultDesc: transaction.result_description || transaction.status,
        TransactionStatus: transaction.status === 'success' ? 'Completed' : transaction.status,
        TransactionReceipt: transaction.receipt_number || 'N/A',
        TransactionAmount: transaction.amount,
        TransactionDate: transaction.transaction_date,
        TransactionReference: transaction.reference,
        Msisdn: transaction.phone,
        MerchantRequestID: transaction.merchant_request_id,
        CheckoutRequestID: transaction.checkout_request_id,
        TransactionID: transaction.transaction_id,
      }),
    }
  } catch (error) {
    console.error('Status check error:', error)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
    }
  }
}

export { handler }
