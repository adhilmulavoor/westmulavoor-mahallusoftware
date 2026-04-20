const SUPABASE_URL = 'https://snxlocwcauhloekrgwtd.supabase.co';
const SUPABASE_KEY = 'sb_publishable_YyRGxznjP-UmDt0c68N4MQ_yZv23Sh2';

async function keepAlive() {
    console.log(`[${new Date().toISOString()}] Starting Supabase keep-alive ping...`);
    
    try {
        // Fetching a single record from families table to minimize payload
        const response = await fetch(`${SUPABASE_URL}/rest/v1/families?select=id&limit=1`, {
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            console.log(`[${new Date().toISOString()}] Success! Supabase project is active.`);
        } else {
            console.error(`[${new Date().toISOString()}] Failed to ping Supabase:`, response.status, response.statusText);
        }
    } catch (error) {
        console.error(`[${new Date().toISOString()}] Error during keep-alive ping:`, error.message);
    }
}

keepAlive();
