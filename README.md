# Zynochat — Next Generation Messaging

Premium real-time chat platform built for communities, privacy, and seamless communication.

## 🚀 Features
- **Premium UI:** 'Obsidian Cosmos' Pro design system with glassmorphism.
- **Responsive:** Optimized for both Desktop and Mobile users.
- **Secure Auth:** Email + OTP authentication via Supabase.
- **Real-time Chat:** Instant messaging powered by Supabase Realtime.
- **AI Integration:** Advanced AI assistant simulation.
- **Private Messaging:** Search and start chats with users.

## 🛠️ Setup Instructions

### 1. Supabase Database
Run the provided `SUPABASE_SETUP.sql` script in your Supabase SQL Editor. This will create:
- `profiles` table (automatically managed via triggers)
- `messages` table (with RLS for security)
- Required RLS policies and Realtime configurations.

### 2. Frontend Configuration
Edit `app.js` and update the following constants with your Supabase project credentials:
```javascript
const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_KEY = 'YOUR_SUPABASE_ANON_KEY';
```

### 3. Local Development
```bash
npm install
node server.js
```
The site will be available at `http://localhost:3000`.

## 🛡️ Security
- **No Hardcoded Keys:** Ensure you never commit your `SUPABASE_SERVICE_ROLE_KEY` to public repositories.
- **RLS Enabled:** Database security is enforced at the row level.
- **Server Hardening:** `server.js` uses Helmet and Rate Limiting to protect against common attacks.

---
© 2025 Zynochat. All rights reserved.
