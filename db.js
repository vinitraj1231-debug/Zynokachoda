const fs = require('fs');
const path = require('path');

// Target directory for database files
const DB_DIR = path.join(__dirname, 'data');
const BACKUP_DIR = path.join(DB_DIR, 'backups');

// Ensure directories exist safely
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

// Schemas define critical fields and their expected types
const SCHEMAS = {
  users: {
    id: (val) => typeof val === 'string',
    username: (val) => typeof val === 'string' && val.length > 0,
    email: (val) => typeof val === 'string' && val.includes('@'),
    password: (val) => typeof val === 'string',
    role: (val) => ['user', 'admin'].includes(val),
    isBanned: (val) => typeof val === 'boolean'
  },
  chats: {
    id: (val) => typeof val === 'string',
    type: (val) => ['direct', 'group'].includes(val),
    participantIds: (val) => Array.isArray(val)
  },
  messages: {
    id: (val) => typeof val === 'string',
    chatId: (val) => typeof val === 'string',
    senderId: (val) => typeof val === 'string',
    text: (val) => typeof val === 'string'
  },
  groups: {
    id: (val) => typeof val === 'string',
    name: (val) => typeof val === 'string' && val.length > 0,
    memberIds: (val) => Array.isArray(val)
  },
  sessions: {
    id: (val) => typeof val === 'string',
    userId: (val) => typeof val === 'string',
    token: (val) => typeof val === 'string'
  },
  reports: {
    id: (val) => typeof val === 'string',
    reporterId: (val) => typeof val === 'string',
    reportedId: (val) => typeof val === 'string',
    reason: (val) => typeof val === 'string' && val.length > 0 && val.length <= 1000
  },
  audit_logs: {
    id: (val) => typeof val === 'string',
    userId: (val) => typeof val === 'string',
    action: (val) => typeof val === 'string'
  }
};

// Global task queue per collection to ensure absolute atomicity of operations
const queues = {};

function enqueue(collection, asyncTask) {
  if (!queues[collection]) {
    queues[collection] = Promise.resolve();
  }
  const nextTask = queues[collection].then(() => asyncTask());
  queues[collection] = nextTask.catch((err) => {
    console.error(`Database error inside queue task for collection "${collection}":`, err);
    throw err;
  });
  return nextTask;
}

class JsonDatabase {
  constructor(collection) {
    if (!SCHEMAS[collection]) {
      throw new Error(`Invalid collection name: ${collection}`);
    }
    this.collection = collection;
    this.filePath = path.join(DB_DIR, `${collection}.json`);
    this.backupPath = path.join(BACKUP_DIR, `${collection}.bak.json`);
    this.initializeFile();
  }

  // Auto-initialize the JSON file if not exists
  initializeFile() {
    if (!fs.existsSync(this.filePath)) {
      this.writeSync([]);
    }
  }

  // Standard synchronous read (fast)
  read() {
    try {
      if (!fs.existsSync(this.filePath)) {
        return [];
      }
      const data = fs.readFileSync(this.filePath, 'utf8');
      return JSON.parse(data || '[]');
    } catch (err) {
      console.error(`Read error on ${this.collection}, attempting to restore from backup...`, err);
      return this.restoreBackup();
    }
  }

  // Direct synchronous write - internal only
  writeSync(data) {
    const tempPath = `${this.filePath}.tmp`;
    try {
      // 1. Create a backup of the current state first
      if (fs.existsSync(this.filePath)) {
        fs.copyFileSync(this.filePath, this.backupPath);
      }

      // 2. Perform atomic file write using temp file replacement
      fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), 'utf8');
      fs.renameSync(tempPath, this.filePath);
    } catch (err) {
      if (fs.existsSync(tempPath)) {
        try { fs.unlinkSync(tempPath); } catch (_) {}
      }
      throw err;
    }
  }

  // Schema validation
  validate(item) {
    const rules = SCHEMAS[this.collection];
    for (const key of Object.keys(rules)) {
      if (!(key in item) || !rules[key](item[key])) {
        throw new Error(`Validation failed for collection "${this.collection}": invalid or missing field "${key}" in object: ${JSON.stringify(item)}`);
      }
    }
    return true;
  }

  // Atomically Create
  async create(item) {
    this.validate(item);

    return enqueue(this.collection, async () => {
      const data = this.read();

      // Enforce uniqueness constraints
      if (this.collection === 'users') {
        const exists = data.find(u => u.username.toLowerCase() === item.username.toLowerCase() || u.email.toLowerCase() === item.email.toLowerCase());
        if (exists) {
          throw new Error("Username or Email already registered");
        }
      }

      data.push(item);
      this.writeSync(data);
      return item;
    });
  }

  // Atomically Update
  async update(id, updates) {
    return enqueue(this.collection, async () => {
      const data = this.read();
      const idx = data.findIndex(item => item.id === id);
      if (idx === -1) {
        throw new Error(`Record with ID ${id} not found in ${this.collection}`);
      }

      const updatedItem = { ...data[idx], ...updates, updatedAt: new Date().toISOString() };
      this.validate(updatedItem);

      // Enforce uniqueness on updates
      if (this.collection === 'users') {
        const dup = data.find(u => u.id !== id && (
          (updates.username && u.username.toLowerCase() === updates.username.toLowerCase()) ||
          (updates.email && u.email.toLowerCase() === updates.email.toLowerCase())
        ));
        if (dup) {
          throw new Error("Username or Email already taken");
        }
      }

      data[idx] = updatedItem;
      this.writeSync(data);
      return updatedItem;
    });
  }

  // Atomically Delete
  async delete(id) {
    return enqueue(this.collection, async () => {
      const data = this.read();
      const initialLen = data.length;
      const filtered = data.filter(item => item.id !== id);
      if (filtered.length === initialLen) {
        throw new Error(`Record with ID ${id} not found in ${this.collection}`);
      }
      this.writeSync(filtered);
      return true;
    });
  }

  // Query helpers
  queryById(id) {
    return this.read().find(item => item.id === id) || null;
  }

  queryByUser(userId) {
    const data = this.read();
    if (this.collection === 'messages') {
      return data.filter(m => m.senderId === userId || (m.chatId && m.chatId.includes(userId)));
    }
    if (this.collection === 'chats') {
      return data.filter(c => c.participantIds && c.participantIds.includes(userId));
    }
    if (this.collection === 'sessions') {
      return data.filter(s => s.userId === userId);
    }
    if (this.collection === 'groups') {
      return data.filter(g => g.memberIds && g.memberIds.includes(userId));
    }
    return data.filter(item => item.userId === userId || item.senderId === userId);
  }

  queryByChat(chatId) {
    if (this.collection === 'messages') {
      return this.read().filter(m => m.chatId === chatId);
    }
    return [];
  }

  queryByTimestamp(since, until = null) {
    const startTime = new Date(since).getTime();
    const endTime = until ? new Date(until).getTime() : Infinity;

    return this.read().filter(item => {
      const t = new Date(item.createdAt || item.timestamp).getTime();
      return t >= startTime && t <= endTime;
    });
  }

  // Backup & Restore
  backup() {
    try {
      if (fs.existsSync(this.filePath)) {
        fs.copyFileSync(this.filePath, this.backupPath);
        return true;
      }
      return false;
    } catch (err) {
      console.error(`Backup failed for ${this.collection}:`, err);
      return false;
    }
  }

  restoreBackup() {
    try {
      if (fs.existsSync(this.backupPath)) {
        const dataStr = fs.readFileSync(this.backupPath, 'utf8');
        const parsed = JSON.parse(dataStr);
        fs.writeFileSync(this.filePath, dataStr, 'utf8');
        console.warn(`Restored ${this.collection} from backup successfully.`);
        return parsed;
      }
      return [];
    } catch (err) {
      console.error(`Critical: Failed to restore backup for ${this.collection}:`, err);
      return [];
    }
  }
}

// Instantiate specific databases
const db = {
  users: new JsonDatabase('users'),
  chats: new JsonDatabase('chats'),
  messages: new JsonDatabase('messages'),
  groups: new JsonDatabase('groups'),
  sessions: new JsonDatabase('sessions'),
  reports: new JsonDatabase('reports'),
  audit_logs: new JsonDatabase('audit_logs')
};

module.exports = db;
