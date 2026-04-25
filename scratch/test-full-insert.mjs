
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://bycpifryzynsiabkpejo.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ5Y3BpZnJ5enluc2lhYmtwZWpvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjM0MDA4MiwiZXhwIjoyMDkxOTE2MDgyfQ.F2goBqADWLcJGVBIX9iOTOnAToNCW3ShoJxzufGMy8A'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testInsert() {
  const testColaborador = {
    nome: 'Teste de Sistema',
    cpf: '000.000.000-00',
    email: 'teste@exemplo.com',
    cargo: 'Analista de Testes',
    setor: 'Tecnologia',
    tipo: 'CLT',
    salario: 5000.00,
    telefone: '(00) 00000-0000',
    status: 'ativo'
  }

  console.log('Tentando inserir colaborador de teste...')
  const { data, error } = await supabase.from('colaboradores').insert(testColaborador).select()

  if (error) {
    console.error('Erro na inserção:', error.message)
  } else {
    console.log('Sucesso! Colaborador inserido:', data[0].nome)
    // Limpar o teste
    await supabase.from('colaboradores').delete().eq('id', data[0].id)
    console.log('Registro de teste removido.')
  }
}

testInsert()
