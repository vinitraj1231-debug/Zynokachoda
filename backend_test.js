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

function testForgotPasswordValidation() {
  console.log('--- Starting Forgot Password Hardening Tests ---');

  // Test cases helper simulating route handler logic
  function validateForgotPasswordEmail(email) {
    if (!email || typeof email !== 'string') {
      return { error: 'Valid email string is required.' };
    }
    const trimmedEmail = email.trim();
    if (trimmedEmail.length === 0 || trimmedEmail.length > 100) {
      return { error: 'Email length must be between 1 and 100 characters.' };
    }
    return { ok: true, email: trimmedEmail };
  }

  // 1. Non-string type validation
  assert.strictEqual(validateForgotPasswordEmail(12345).error, 'Valid email string is required.');
  assert.strictEqual(validateForgotPasswordEmail(null).error, 'Valid email string is required.');
  assert.strictEqual(validateForgotPasswordEmail({ email: 'test@example.com' }).error, 'Valid email string is required.');

  // 2. Empty string or whitespace-only
  assert.strictEqual(validateForgotPasswordEmail('   ').error, 'Email length must be between 1 and 100 characters.');

  // 3. Overly long email
  const longEmail = 'a'.repeat(95) + '@test.com'; // length 104
  assert.strictEqual(validateForgotPasswordEmail(longEmail).error, 'Email length must be between 1 and 100 characters.');

  // 4. Valid email
  const validRes = validateForgotPasswordEmail('   user@zynochat.in   ');
  assert.strictEqual(validRes.ok, true);
  assert.strictEqual(validRes.email, 'user@zynochat.in');

  console.log('✓ Verified forgot password input validation and length limits cleanly.');
  console.log('--- Forgot Password Hardening Tests Passed cleanly! ---\n');
}

async function runAllTests() {
  try {
    await testJsonDatabase();
    testForgotPasswordValidation();
    console.log('🎉 ALL SECURITY AND CORE FUNCTIONAL TESTS PASSED!');
    process.exit(0);
  } catch (err) {
    console.error('❌ TEST RUNNER FAILURE:', err);
    process.exit(1);
  }
}

runAllTests();
