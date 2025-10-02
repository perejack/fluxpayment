import { Handler, HandlerEvent, HandlerContext } from '@netlify/functions'

interface WebhookPayload {
  ResponseCode: number
  ResponseDescription: string
  MerchantRequestID?: string
  CheckoutRequestID?: string
  TransactionID?: string
  TransactionAmount?: number
  TransactionReceipt?: string
  TransactionDate?: string
  TransactionReference?: string
  Msisdn?: string
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
    // Parse webhook payload
    const payload: WebhookPayload = JSON.parse(event.body || '{}')

    // Log the webhook data
    console.log('=== PesaFlux Webhook Received ===')
    console.log('Timestamp:', new Date().toISOString())
    console.log('Payload:', JSON.stringify(payload, null, 2))

    // Validate webhook data
    if (!payload.TransactionID) {
      console.error('Invalid webhook: Missing TransactionID')
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          status: 'error',
          message: 'Invalid webhook data' 
        }),
      }
    }

    // Extract transaction details
    const {
      ResponseCode,
      ResponseDescription,
      TransactionID,
      TransactionAmount,
      TransactionReceipt,
      TransactionDate,
      TransactionReference,
      Msisdn,
      MerchantRequestID,
      CheckoutRequestID,
    } = payload

    // Process based on response code
    if (ResponseCode === 0) {
      // Transaction successful
      console.log('✓ Transaction Successful')
      console.log(`  Transaction ID: ${TransactionID}`)
      console.log(`  Amount: KES ${TransactionAmount}`)
      console.log(`  Receipt: ${TransactionReceipt}`)
      console.log(`  Phone: ${Msisdn}`)
      console.log(`  Reference: ${TransactionReference}`)
      console.log(`  Date: ${TransactionDate}`)

      // Here you would typically:
      // 1. Update your database with the successful payment
      // 2. Send confirmation email/SMS to customer
      // 3. Trigger any business logic (e.g., activate subscription, deliver product)
      // 4. Store the transaction receipt for records

      // Example: You could store this in a database or external service
      // await storeTransaction({
      //   transactionId: TransactionID,
      //   amount: TransactionAmount,
      //   receipt: TransactionReceipt,
      //   phone: Msisdn,
      //   reference: TransactionReference,
      //   status: 'completed',
      //   timestamp: new Date(TransactionDate),
      // })

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ 
          status: 'success',
          message: 'Webhook processed successfully',
          transactionId: TransactionID,
        }),
      }
    } else {
      // Transaction failed
      console.log('✗ Transaction Failed')
      console.log(`  Transaction ID: ${TransactionID}`)
      console.log(`  Response Code: ${ResponseCode}`)
      console.log(`  Description: ${ResponseDescription}`)
      console.log(`  Phone: ${Msisdn}`)
      console.log(`  Reference: ${TransactionReference}`)

      // Here you would typically:
      // 1. Update your database with the failed payment
      // 2. Notify customer about the failure
      // 3. Log the failure reason for analysis

      // Example: Store failed transaction
      // await storeTransaction({
      //   transactionId: TransactionID,
      //   status: 'failed',
      //   failureReason: ResponseDescription,
      //   responseCode: ResponseCode,
      //   phone: Msisdn,
      //   reference: TransactionReference,
      // })

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ 
          status: 'received',
          message: 'Failed transaction logged',
          transactionId: TransactionID,
        }),
      }
    }
  } catch (error) {
    console.error('Webhook processing error:', error)
    
    // Still return 200 to acknowledge receipt
    // This prevents PesaFlux from retrying the webhook
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        status: 'error',
        message: 'Webhook received but processing failed',
      }),
    }
  }
}

export { handler }
