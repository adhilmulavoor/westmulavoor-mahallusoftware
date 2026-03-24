const url = 'https://zqrpzaoahiritzmhsfkk.supabase.co/rest/v1/families?select=%2A';
const key = 'sb_publishable_I-njdu8wZAP7KdsxmG_5KA_GziImyUM';

fetch(url, {
  headers: {
    'apikey': key,
    'Authorization': `Bearer ${key}`
  }
}).then(res => res.json())
  .then(data => console.log('Data fetched successfully, count:', data.length || data))
  .catch(err => {
    console.error('Error fetching Data:', err.message);
    if (err.cause) {
      console.error('Cause:', err.cause);
    }
  });
