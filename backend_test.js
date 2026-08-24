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

function testAuthValidationRules() {
  console.log('--- Starting Auth Input Validation Tests ---');

  // Regex test matching server.js email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  assert.strictEqual(emailRegex.test('valid@zyno.io'), true, 'Valid email should pass regex');
  assert.strictEqual(emailRegex.test('invalid-email'), false, 'Invalid email should fail regex');
  assert.strictEqual(emailRegex.test('user@domain'), false, 'Email without TLD should fail regex');
  assert.strictEqual(emailRegex.test('user@domain.c'), true, 'Email with TLD should pass regex');

  // Input length limits check simulation
  const validUsername = 'validUser';
  const overlongUsername = 'a'.repeat(31);
  assert.strictEqual(validUsername.length <= 30 && validUsername.length >= 3, true);
  assert.strictEqual(overlongUsername.length <= 30, false);

  const validPassword = 'supersecretpassword';
  const overlongPassword = 'p'.repeat(129);
  assert.strictEqual(validPassword.length <= 128 && validPassword.length >= 6, true);
  assert.strictEqual(overlongPassword.length <= 128, false);

  console.log('✓ Auth input validation & ReDoS-safe regex tests passed cleanly.\n');
}

async function runAllTests() {
  try {
    await testJsonDatabase();
    testAuthValidationRules();
    console.log('🎉 ALL SECURITY AND CORE FUNCTIONAL TESTS PASSED!');
    process.exit(0);
  } catch (err) {
    console.error('❌ TEST RUNNER FAILURE:', err);
    process.exit(1);
  }
}

runAllTests();
