
import fs from 'fs';

async function runSql() {
  const token = 'sbp_2adfffd56334bc6e084d445612bb7e0b9b25578a';
  const projectRef = 'bycpifryzynsiabkpejo';
  const sql = fs.readFileSync('supabase-schema.sql', 'utf8');
  
  console.log('Enviando SQL para o projeto:', projectRef);
  
  const response = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/query`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query: sql })
  });
  
  const data = await response.json();
  if (response.ok) {
    console.log('SQL executado com sucesso!');
  } else {
    console.error('Erro ao executar SQL:', JSON.stringify(data, null, 2));
  }
}

runSql();
