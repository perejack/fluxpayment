import { Handler, HandlerEvent, HandlerContext } from '@netlify/functions'

interface StatusRequest {
  transaction_id: string
}

interface PesaFluxStatusResponse {
  ResponseCode?: number
  ResponseDescription?: string
  TransactionReceipt?: string
  TransactionAmount?: number
  TransactionDate?: string
  Msisdn?: string
  MerchantRequestID?: string
  CheckoutRequestID?: string
  TransactionID?: string
  TransactionReference?: string
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
    const { transaction_id } = body

    // Validate required fields
    if (!transaction_id) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'Missing required field: transaction_id' 
        }),
      }
    }

    // API key hardcoded for deployment
    const apiKey = 'PSFXyLBOrRV9'

    // Prepare request to PesaFlux API
    const pesafluxPayload = {
      api_key: apiKey,
      transaction_id: transaction_id,
    }

    console.log('Checking transaction status:', transaction_id)

    // Make request to PesaFlux API
    const response = await fetch('https://api.pesaflux.co.ke/api/v1/payments/transaction-status', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(pesafluxPayload),
    })

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
