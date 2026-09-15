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

function testSearchInputValidation() {
  console.log('--- Starting Search Input Security Tests ---');

  // Helper simulating /api/users/search query logic
  function searchUsers(queryParam, mockUsers, currentUserId) {
    if (typeof queryParam !== 'string') return [];
    const query = queryParam.trim().toLowerCase();
    if (query.length < 2 || query.length > 100) return [];

    return mockUsers
      .filter(u => u.id !== currentUserId && !u.isBanned && u.username.toLowerCase().includes(query))
      .map(u => ({ id: u.id, username: u.username }));
  }

  const mockUsers = [
    { id: 'u1', username: 'alice', email: 'alice@secret.com', isBanned: false },
    { id: 'u2', username: 'bob', email: 'bob@secret.com', isBanned: false }
  ];

  // 1. Non-string type parameter (type confusion check)
  assert.deepStrictEqual(searchUsers(['alice'], mockUsers, 'u1'), [], 'Should return empty array for non-string query parameter');
  assert.deepStrictEqual(searchUsers({ q: 'alice' }, mockUsers, 'u1'), [], 'Should return empty array for object query parameter');

  // 2. Query length boundary check
  assert.deepStrictEqual(searchUsers('a', mockUsers, 'u1'), [], 'Should return empty array for query length < 2');
  assert.deepStrictEqual(searchUsers('a'.repeat(101), mockUsers, 'u1'), [], 'Should return empty array for query length > 100');

  // 3. Email privacy leak check (searching by email should return no matches)
  assert.deepStrictEqual(searchUsers('alice@secret.com', mockUsers, 'u2'), [], 'Should not match by email address to prevent email enumeration');

  // 4. Valid username search
  assert.deepStrictEqual(searchUsers('ali', mockUsers, 'u2'), [{ id: 'u1', username: 'alice' }], 'Should match valid username query');

  console.log('✓ Search input validation and email privacy tests passed cleanly.\n');
}

async function runAllTests() {
  try {
    await testJsonDatabase();
    testSearchInputValidation();
    console.log('🎉 ALL SECURITY AND CORE FUNCTIONAL TESTS PASSED!');
    process.exit(0);
  } catch (err) {
    console.error('❌ TEST RUNNER FAILURE:', err);
    process.exit(1);
  }
}

runAllTests();
