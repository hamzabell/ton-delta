const { Client } = require('pg');

const variants = [
  'postgresql://test:test@localhost:5432/test',
  'postgresql://postgres:postgres@localhost:5432/postgres',
  'postgresql://postgres:password@localhost:5432/postgres',
  'postgresql://postgres@localhost:5432/postgres',
  `postgresql://${process.env.USER}@localhost:5432/postgres`
];

async function probe() {
  for (const url of variants) {
    console.log(`Testing: ${url}`);
    const client = new Client({ connectionString: url });
    try {
      await client.connect();
      console.log(`✅ SUCCESS: Connected with ${url}`);
      await client.end();
      process.exit(0);
    } catch (e) {
      console.log(`❌ Failed: ${e.message}`);
      await client.end().catch(() => {});
    }
  }
  console.log('ALL FAILED');
  process.exit(1);
}

probe();
