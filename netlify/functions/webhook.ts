import { Handler, HandlerEvent, HandlerContext } from '@netlify/functions'
import { supabase } from './supabase'

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

export const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
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

    // Determine status based on response code
    let status: 'success' | 'failed' | 'cancelled' = 'failed'
    let statusMessage = ResponseDescription

    if (ResponseCode === 0) {
      status = 'success'
      statusMessage = 'Payment completed successfully'
    } else if (ResponseCode === 1032 || ResponseCode === 1031) {
      status = 'cancelled'
      statusMessage = 'Payment was cancelled'
    }

    // Update transaction in database
    try {
      const { error: updateError } = await supabase
        .from('transactions')
        .update({
          status: status,
          result_code: ResponseCode.toString(),
          result_description: statusMessage,
          receipt_number: TransactionReceipt,
          merchant_request_id: MerchantRequestID,
          checkout_request_id: CheckoutRequestID,
          transaction_date: TransactionDate,
          transaction_id: TransactionID,
          updated_at: new Date().toISOString(),
        })
        .eq('merchant_request_id', MerchantRequestID)

      if (updateError) {
        console.error('Database update error:', updateError)
        console.log('Transaction updated in database:', TransactionID)
      }
    } catch (dbErr) {
      console.error('Database update error:', dbErr)
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        status: 'success',
        message: 'Webhook processed successfully',
        transactionId: TransactionID,
      }),
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

