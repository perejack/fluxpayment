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
      // Try to find the transaction by multiple identifiers
      let query = supabase.from('transactions')

      // First try merchant_request_id
      let { data: transaction, error: findError } = await query
        .select('*')
        .eq('merchant_request_id', MerchantRequestID)
        .maybeSingle()

      // If not found, try checkout_request_id
      if (!transaction && CheckoutRequestID) {
        const result = await supabase
          .from('transactions')
          .select('*')
          .eq('checkout_request_id', CheckoutRequestID)
          .maybeSingle()
        transaction = result.data
      }

      // If not found, try transaction_request_id (fallback)
      if (!transaction && TransactionReference) {
        const result = await supabase
          .from('transactions')
          .select('*')
          .eq('reference', TransactionReference)
          .maybeSingle()
        transaction = result.data
      }

      // If still not found, update the most recent pending transaction for this phone
      if (!transaction && Msisdn) {
        const result = await supabase
          .from('transactions')
          .select('*')
          .eq('phone', Msisdn)
          .eq('status', 'pending')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()
        transaction = result.data
      }

      if (transaction) {
        console.log('Found transaction to update:', transaction.id)

        // Parse PesaFlux date format: "20251002131402" → "2025-10-02 13:14:02"
        let parsedDate: string | null = null
        if (TransactionDate && TransactionDate.length === 14) {
          try {
            const year = TransactionDate.substring(0, 4)
            const month = TransactionDate.substring(4, 6)
            const day = TransactionDate.substring(6, 8)
            const hour = TransactionDate.substring(8, 10)
            const minute = TransactionDate.substring(10, 12)
            const second = TransactionDate.substring(12, 14)
            parsedDate = `${year}-${month}-${day} ${hour}:${minute}:${second}`
            console.log('Parsed date:', TransactionDate, '→', parsedDate)
          } catch (dateErr) {
            console.error('Date parsing error:', dateErr)
          }
        }

        const { error: updateError } = await supabase
          .from('transactions')
          .update({
            status: status,
            result_code: ResponseCode.toString(),
            result_description: statusMessage,
            receipt_number: TransactionReceipt !== 'N/A' ? TransactionReceipt : null,
            merchant_request_id: MerchantRequestID,
            checkout_request_id: CheckoutRequestID,
            transaction_date: parsedDate,
            transaction_id: TransactionID,
            updated_at: new Date().toISOString(),
          })
          .eq('id', transaction.id)

        if (updateError) {
          console.error('Database update error:', updateError)
        } else {
          console.log('Transaction updated successfully:', TransactionID, 'Status:', status)
        }
      } else {
        console.error('Transaction not found for webhook. Payload:', {
          MerchantRequestID,
          CheckoutRequestID,
          TransactionReference,
          Msisdn
        })
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

export { handler }
