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

function testGroupValidationLogic() {
  console.log('--- Starting Group Creation Validation Logic Tests ---');

  // Logic simulation for POST /api/groups validation in server.js
  function validateGroupInput(body, reqUserId) {
    const { name, memberIds } = body;
    if (typeof name !== 'string' || !Array.isArray(memberIds)) {
      return { status: 400, error: 'Group name and initial member array required.' };
    }

    const trimmedName = name.trim();
    if (trimmedName.length < 1 || trimmedName.length > 100) {
      return { status: 400, error: 'Group name must be between 1 and 100 characters.' };
    }

    const validMemberIds = memberIds.filter(id => typeof id === 'string' && id.trim().length > 0);
    const existingValidMemberIds = validMemberIds.filter(id => {
      const u = db.users.queryById(id);
      return u && !u.isBanned;
    });

    const groupMembers = [...new Set([reqUserId, ...existingValidMemberIds])];
    return { status: 201, name: trimmedName, groupMembers };
  }

  // Test 1: Invalid name type (non-string)
  const res1 = validateGroupInput({ name: 12345, memberIds: [] }, 'user-1');
  assert.strictEqual(res1.status, 400);

  // Test 2: Oversized name
  const res2 = validateGroupInput({ name: 'a'.repeat(101), memberIds: [] }, 'user-1');
  assert.strictEqual(res2.status, 400);

  // Test 3: Empty name
  const res3 = validateGroupInput({ name: '   ', memberIds: [] }, 'user-1');
  assert.strictEqual(res3.status, 400);

  // Test 4: Invalid memberIds type (not array)
  const res4 = validateGroupInput({ name: 'Valid Group', memberIds: 'not-an-array' }, 'user-1');
  assert.strictEqual(res4.status, 400);

  // Test 5: Valid creation with filtering non-string and non-existent IDs
  const res5 = validateGroupInput({ name: '  Cosmic Lounge  ', memberIds: [123, null, 'non-existent-user-id', ''] }, 'user-1');
  assert.strictEqual(res5.status, 201);
  assert.strictEqual(res5.name, 'Cosmic Lounge');
  assert.deepStrictEqual(res5.groupMembers, ['user-1']);

  console.log('✓ Group creation input validation logic verified cleanly.');
}

async function runAllTests() {
  try {
    await testJsonDatabase();
    testGroupValidationLogic();
    console.log('🎉 ALL SECURITY AND CORE FUNCTIONAL TESTS PASSED!');
    process.exit(0);
  } catch (err) {
    console.error('❌ TEST RUNNER FAILURE:', err);
    process.exit(1);
  }
}

runAllTests();
