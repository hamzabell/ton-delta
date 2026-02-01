import { processEntryJob } from '../workers/jobs/entry';

async function testEntryJob() {
  console.log('=== Testing Entry Job ===\n');
  
  try {
    const result = await processEntryJob({ 
      id: 'manual-test', 
      name: 'entry-job', 
      data: {} 
    });
    
    console.log('✅ Entry job completed successfully!');
    console.log('Result:', result);
  } catch (err) {
    console.error('❌ Entry job failed:');
    console.error(err);
  }
  
  process.exit(0);
}

testEntryJob();
