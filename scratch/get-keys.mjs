
async function getKeys() {
  const token = process.env.SUPABASE_ACCESS_TOKEN;
  const projectRef = 'bycpifryzynsiabkpejo';
  
  const response = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/api-keys`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  const data = await response.json();
  console.log(JSON.stringify(data, null, 2));
}

getKeys();
