import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://dbpbvoqfexofyxcexmmp.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRicGJ2b3FmZXhvZnl4Y2V4bW1wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzNDc0NTMsImV4cCI6MjA3NDkyMzQ1M30.hGn7ux2xnRxseYCjiZfCLchgOEwIlIAUkdS6h7byZqc'

export const supabase = createClient(supabaseUrl, supabaseKey)

export interface Transaction {
  id?: string
  transaction_id?: string
  transaction_request_id: string
  status: 'pending' | 'success' | 'failed' | 'cancelled'
  amount?: number
  phone?: string
  email?: string
  reference?: string
  result_code?: string
  result_description?: string
  receipt_number?: string
  merchant_request_id?: string
  checkout_request_id?: string
  transaction_date?: string
  created_at?: string
  updated_at?: string
}
