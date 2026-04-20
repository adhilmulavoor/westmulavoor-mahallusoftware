const url = 'https://snxlocwcauhloekrgwtd.supabase.co/rest/v1/families?select=%2A';
const key = 'sb_publishable_YyRGxznjP-UmDt0c68N4MQ_yZv23Sh2';

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
