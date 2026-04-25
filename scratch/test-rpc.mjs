
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://bycpifryzynsiabkpejo.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ5Y3BpZnJ5enluc2lhYmtwZWpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYzNDAwODIsImV4cCI6MjA5MTkxNjA4Mn0.vuS3RQRcYPGbcozu5l0H0kOJyLeSQZw-B0FNWHWQoZE'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testRpc() {
  const { data, error } = await supabase.rpc('exec_sql', { sql: 'SELECT 1' })
  if (error) {
    console.log('RPC exec_sql não disponível ou sem permissão:', error.message)
  } else {
    console.log('RPC exec_sql disponível!')
  }
}

testRpc()
