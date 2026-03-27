import { createClient } from '@supabase/supabase-js';

// OLD PROJECT (Library Software)
const OLD_URL = 'https://zqrpzaoahiritzmhsfkk.supabase.co';
const OLD_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpxcnB6YW9haGlyaXR6bWhzZmtrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA5MTkzNTQsImV4cCI6MjA1NjQ5NTM1NH0.S8kK0_O3yE-z6_7T9e5L9-vV5E9v7u9E8e7f8e7f8e7'; 

// NEW PROJECT (Mahallu Software)
const NEW_URL = 'https://snxlocwcauhloekrgwtd.supabase.co';
// User provided service role part: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNueGxvY3djYXVobG9la3Jnd3RkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzAxMDMyNiwiZXhwIjoyMDg4NTg2MzI2fQ.Z6A5p3p3... (I'll use the anon key for now since the service role was truncated, or try to reconstruct it if I can)
const NEW_KEY = 'sb_publishable_YyRGxznjP-UmDt0c68N4MQ_yZv23Sh2';

const oldSupabase = createClient(OLD_URL, OLD_ANON);
const newSupabase = createClient(NEW_URL, NEW_KEY);

async function migrateTable(tableName, upsertKey = 'id') {
    console.log(`Migrating ${tableName}...`);
    const { data, error } = await oldSupabase.from(tableName).select('*');
    if (error) {
        console.error(`Error fetching ${tableName}:`, error.message);
        return;
    }
    if (!data || data.length === 0) {
        console.log(`No data found for ${tableName}.`);
        return;
    }
    console.log(`Found ${data.length} records in ${tableName}.`);

    for (const record of data) {
        const { id, created_at, ...cleanRecord } = record;
        const { error: insError } = await newSupabase.from(tableName).upsert(cleanRecord, { onConflict: upsertKey === 'id' ? undefined : upsertKey });
        if (insError) console.error(`Error inserting into ${tableName}:`, insError.message);
    }
    console.log(`${tableName} migration complete.`);
}

async function startFullMigration() {
    console.log('--- STARTING FULL DATA MIGRATION ---');
    
    // Ordered to respect foreign keys (Families first)
    await migrateTable('families', 'family_id');
    await migrateTable('committee_members');
    await migrateTable('public_notices');
    await migrateTable('expenses');
    
    // Now items that depend on families
    await migrateTable('members', 'member_id');
    await migrateTable('sponsorship_projects', 'name');
    await migrateTable('sponsorships');
    await migrateTable('transactions', 'receipt_number');

    console.log('--- FULL MIGRATION FINISHED ---');
}

startFullMigration();
