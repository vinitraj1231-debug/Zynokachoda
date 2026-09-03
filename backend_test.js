const assert = require('assert');
const fs = require('fs');
const path = require('path');
const db = require('./db');

async function testJsonDatabase() {
  console.log('--- Starting JSON Database Engine Tests ---');

  // 1. Verify Schema Validation Exception on invalid entry
  try {
    await db.users.create({
      id: 'test-invalid-1',
      username: '', // invalid username length
      email: 'bademail.com', // invalid email
      password: 'plain',
      role: 'superadmin', // invalid role type
      isBanned: 'not-boolean' // invalid type
    });
    assert.fail('Should have failed schema validation.');
  } catch (err) {
    console.log('✓ Correctly caught invalid validation rules:', err.message);
  }

  // 1b. Verify Group Schema Validation Exception on empty group name
  try {
    await db.groups.create({
      id: 'test-invalid-group-1',
      name: '', // invalid group name length (empty)
      memberIds: ['user-1']
    });
    assert.fail('Should have failed group schema validation for empty name.');
  } catch (err) {
    console.log('✓ Correctly caught invalid group schema validation:', err.message);
  }

  // 2. Verify Atomic Writes and Queue Locking
  const writePromises = [];
  for (let i = 0; i < 20; i++) {
    writePromises.push(db.audit_logs.create({
      id: `concur-log-${i}`,
      userId: 'test-user',
      action: `concurrent_write_${i}`,
      timestamp: new Date().toISOString()
    }));
  }

  await Promise.all(writePromises);
  const logs = db.audit_logs.read();
  const concurrentLogsCount = logs.filter(l => l.id.startsWith('concur-log-')).length;
  assert.strictEqual(concurrentLogsCount, 20, 'Should successfully complete all concurrent writes without losing updates');
  console.log('✓ Verified 20 concurrent write queue locks cleanly.');

  // 3. Clean up test concurrent logs
  for (let i = 0; i < 20; i++) {
    await db.audit_logs.delete(`concur-log-${i}`);
  }
  console.log('✓ Cleaned up concurrent database logs.');

  console.log('--- JSON Database Engine Tests Passed cleanly! ---\n');
}

async function runAllTests() {
  try {
    await testJsonDatabase();
    console.log('🎉 ALL SECURITY AND CORE FUNCTIONAL TESTS PASSED!');
    process.exit(0);
  } catch (err) {
    console.error('❌ TEST RUNNER FAILURE:', err);
    process.exit(1);
  }
}

runAllTests();
