import { Handler, HandlerEvent, HandlerContext } from '@netlify/functions'

interface StatusRequest {
  api_key: string
  email: string
  transaction_request_id: string
}

interface PesaFluxStatusResponse {
  ResultCode?: string | number
  ResultDesc?: string
  TransactionReceipt?: string
  TransactionAmount?: number
  TransactionDate?: string
  Msisdn?: string
  MerchantRequestID?: string
  CheckoutRequestID?: string
  TransactionID?: string
  TransactionReference?: string
  TransactionStatus?: string
  TransactionCode?: string
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

    // Prepare request to PesaFlux API
    const pesafluxPayload = {
      api_key: apiKey,
      email: email,
      transaction_request_id: transaction_request_id,
    }

    console.log('Checking transaction status:', transaction_request_id)

    // Make request to PesaFlux API
    const response = await fetch('https://api.pesaflux.co.ke/api/v1/payments/transaction-status', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'PesaFlux-Payment-App/1.0'
      },
      body: JSON.stringify(pesafluxPayload),
    })

    console.log('API Response status:', response.status, response.statusText)
    console.log('API Response headers:', Object.fromEntries(response.headers.entries()))

    const responseText = await response.text()
    console.log('PesaFlux status response:', responseText)

    let data: PesaFluxStatusResponse
    try {
      data = JSON.parse(responseText)
    } catch (e) {
      console.error('Failed to parse PesaFlux response:', responseText)
      return {
        statusCode: 502,
        headers,
        body: JSON.stringify({ 
          error: 'Invalid response from payment service' 
        }),
      }
    }

    // Return the status data
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(data),
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
