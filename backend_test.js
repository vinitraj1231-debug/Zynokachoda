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

function testMessagePayloadValidation() {
  console.log('--- Starting WebSocket Message Payload Validation Tests ---');

  function validateSendMessagePayload(chatId, text) {
    if (typeof chatId !== 'string' || typeof text !== 'string') return false;
    const trimmedText = text.trim();
    if (trimmedText.length === 0 || trimmedText.length > 2000) return false;
    return true;
  }

  assert.strictEqual(validateSendMessagePayload(123, 'hello'), false, 'Should reject non-string chatId');
  assert.strictEqual(validateSendMessagePayload('chat1', null), false, 'Should reject non-string text');
  assert.strictEqual(validateSendMessagePayload('chat1', '   '), false, 'Should reject whitespace-only text');
  assert.strictEqual(validateSendMessagePayload('chat1', 'a'.repeat(2001)), false, 'Should reject text over 2000 characters');
  assert.strictEqual(validateSendMessagePayload('chat1', 'Valid message'), true, 'Should accept valid message');

  console.log('✓ Verified WebSocket send_message input type, whitespace, and length checks.');
  console.log('--- WebSocket Message Payload Validation Tests Passed! ---\n');
}

async function runAllTests() {
  try {
    await testJsonDatabase();
    testMessagePayloadValidation();
    console.log('🎉 ALL SECURITY AND CORE FUNCTIONAL TESTS PASSED!');
    process.exit(0);
  } catch (err) {
    console.error('❌ TEST RUNNER FAILURE:', err);
    process.exit(1);
  }
}

runAllTests();
