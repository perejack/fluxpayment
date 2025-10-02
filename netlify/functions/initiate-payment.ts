import { Handler, HandlerEvent, HandlerContext } from '@netlify/functions'

interface PaymentRequest {
  msisdn: string
  amount: number
  email: string
  reference: string
}

interface PesaFluxResponse {
  success: string | number
  massage?: string
  message?: string
  transaction_request_id?: string
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
    const body: PaymentRequest = JSON.parse(event.body || '{}')
    const { msisdn, amount, email, reference } = body

    // Validate required fields
    if (!msisdn || !amount || !email || !reference) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'Missing required fields: msisdn, amount, email, reference' 
        }),
      }
    }

    // Validate phone number format
    if (!msisdn.match(/^254\d{9}$/)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'Invalid phone number format. Must be 254XXXXXXXXX' 
        }),
      }
    }

    // Validate amount
    if (amount < 1) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'Amount must be at least 1 KES' 
        }),
      }
    }

    // API key hardcoded for deployment
    const apiKey = 'PSFXyLBOrRV9'

    // Prepare request to PesaFlux API
    const pesafluxPayload = {
      api_key: apiKey,
      email: email,
      amount: amount.toString(),
      msisdn: msisdn,
      reference: reference,
    }

    console.log('Initiating payment:', { msisdn, amount, reference })

    // Make request to PesaFlux API
    const response = await fetch('https://api.pesaflux.co.ke/api/v1/payments/stk-push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(pesafluxPayload),
    })

    const responseText = await response.text()
    console.log('PesaFlux response:', responseText)

    let data: PesaFluxResponse
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

    // Check if request was successful
    if (data.success === '200' || data.success === 200) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: data.success,
          massage: data.massage || data.message || 'Request sent successfully',
          transaction_request_id: data.transaction_request_id,
        }),
      }
    } else {
      console.error('PesaFlux error:', data)
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: data.massage || data.message || 'Payment initiation failed',
          details: data,
        }),
      }
    }
  } catch (error) {
    console.error('Payment initiation error:', error)
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
