import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://snxlocwcauhloekrgwtd.supabase.co';
const supabaseKey = 'sb_publishable_YyRGxznjP-UmDt0c68N4MQ_yZv23Sh2';
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    console.log('--- Testing direct query ---');
    const { data: family, error: famErr } = await supabase
        .from('families')
        .select('id, family_id, house_name')
        .ilike('family_id', 'F101')
        .single();
    
    if (famErr) {
        console.error('Direct query error:', famErr.message);
    } else {
        console.log('Found family:', family);
    }

    console.log('\n--- Testing RPC check_family_exists ---');
    const { data: exists, error: rpcErr } = await supabase
        .rpc('check_family_exists', { f_id: 'F101' });

    if (rpcErr) {
        console.error('RPC error:', rpcErr.message);
    } else {
        console.log('RPC check_family_exists result:', exists);
    }
}

check();
