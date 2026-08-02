const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const db = require('./db');

async function seed() {
  try {
    const existingUsers = db.users.read();
    if (existingUsers.length > 0) {
      console.log('Database already contains records. Skipping seed injection.');
      return;
    }

    console.log('Seeding highly secured production JSON database files...');

    const salt = await bcrypt.genSalt(10);
    const adminPassword = await bcrypt.hash('admin123', salt);
    const user1Password = await bcrypt.hash('user1234', salt);
    const user2Password = await bcrypt.hash('user1234', salt);

    // 1. Seed Users
    const adminUser = {
      id: 'admin-id-111',
      username: 'admin',
      email: 'admin@zynochat.in',
      password: adminPassword,
      role: 'admin',
      isBanned: false,
      createdAt: new Date().toISOString()
    };

    const user1 = {
      id: 'user-id-222',
      username: 'vinit_raj',
      email: 'vinit@zyno.io',
      password: user1Password,
      role: 'user',
      isBanned: false,
      createdAt: new Date().toISOString()
    };

    const user2 = {
      id: 'user-id-333',
      username: 'spammer_01',
      email: 'spammer@shady.com',
      password: user2Password,
      role: 'user',
      isBanned: false,
      createdAt: new Date().toISOString()
    };

    await db.users.create(adminUser);
    await db.users.create(user1);
    await db.users.create(user2);

    // 2. Seed Chats
    const mainChat = {
      id: 'chat-id-direct-1',
      type: 'direct',
      participantIds: ['admin-id-111', 'user-id-222'],
      createdAt: new Date().toISOString()
    };
    await db.chats.create(mainChat);

    // 3. Seed Messages
    const message1 = {
      id: 'msg-id-1',
      chatId: 'chat-id-direct-1',
      senderId: 'admin-id-111',
      text: 'Hello Vinit! Welcome to Zyno Secured Chat Lounge. 🚀 Let me know if you discover any security bypasses.',
      createdAt: new Date(Date.now() - 3600 * 1000).toISOString()
    };

    const message2 = {
      id: 'msg-id-2',
      chatId: 'chat-id-direct-1',
      senderId: 'user-id-222',
      text: 'Thanks admin! I tried running typical SQL Injection patterns on the auth forms but they were safely handled. Awesome design!',
      createdAt: new Date(Date.now() - 1800 * 1000).toISOString()
    };

    await db.messages.create(message1);
    await db.messages.create(message2);

    // 4. Seed Audit Logs
    const log1 = {
      id: uuidv4(),
      userId: 'system',
      action: 'database_seed_success',
      details: { usersSeeded: 3 },
      timestamp: new Date().toISOString()
    };
    await db.audit_logs.create(log1);

    // 5. Seed Abuse Reports
    const report1 = {
      id: 'report-id-1',
      reporterId: 'user-id-222',
      reportedId: 'user-id-333',
      reason: 'User is sending malicious external phishing links inside conversation lounge.',
      createdAt: new Date().toISOString()
    };
    await db.reports.create(report1);

    console.log('Database seeded successfully with premium test accounts:');
    console.log('- Admin Username: admin | Password: admin123');
    console.log('- User Username: vinit_raj | Password: user1234');
    console.log('- Spammer Username: spammer_01 | Password: user1234');
  } catch (err) {
    console.error('Failed to seed JSON databases:', err);
  }
}

// Export and run if invoked directly
module.exports = seed;
if (require.main === module) {
  seed();
}
