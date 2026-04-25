
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://bycpifryzynsiabkpejo.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ5Y3BpZnJ5enluc2lhYmtwZWpvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjM0MDA4MiwiZXhwIjoyMDkxOTE2MDgyfQ.F2goBqADWLcJGVBIX9iOTOnAToNCW3ShoJxzufGMy8A'

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkSchema() {
  const { data, error, count } = await supabase.from('colaboradores').select('*', { count: 'exact' })
  if (error) {
    console.error('Erro:', error.message)
  } else {
    console.log('Total de registros:', count)
    if (data.length > 0) {
      console.log('Colunas detectadas:', Object.keys(data[0]))
    } else {
      console.log('Tabela vazia, não foi possível detectar todas as colunas via SELECT.')
    }
  }
}

checkSchema()
