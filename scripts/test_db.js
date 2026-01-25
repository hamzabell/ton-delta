/* eslint-disable @typescript-eslint/no-require-imports */
const { Client } = require('pg');

const connectionString = process.env.DATABASE_URL;

async function testConnection(ssl) {
    console.log(`Testing connection with SSL=${ssl}...`);
    const client = new Client({
        connectionString: connectionString,
        ssl: ssl ? { rejectUnauthorized: false } : false
    });

    try {
        await client.connect();
        console.log('✅ Connection Successful!');
        const res = await client.query('SELECT NOW()');
        console.log('Time from DB:', res.rows[0]);
        await client.end();
        return true;
    } catch (err) {
        console.error('❌ Connection Failed:', err.message);
        await client.end();
        return false;
    }
}

async function main() {
    let success = await testConnection(false);
    if (!success) {
        console.log('--- Retrying with SSL ---');
        success = await testConnection(true);
    }
}

main();
