const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const path = require('path');
const http = require('http'); // Required for Socket.io
const { Server } = require('socket.io'); // Required for Socket.io
require('dotenv').config();

const app = express();

// --- SOCKET.IO SERVER SETUP ---
const server = http.createServer(app);

// ✅ FIX: Increase Server Timeouts to prevent "Connection Timeout" during Email handshakes
server.timeout = 60000; // 60 seconds
server.keepAliveTimeout = 61000;

const io = new Server(server, {
    cors: {
        // ✅ UPDATE: Supporting local and production origins
        origin: ['http://localhost:5173', 'https://chrikitn-frontend.vercel.app', 'https://chrikitn.vercel.app'],
        methods: ['GET', 'POST'],
        credentials: true
    }
});

// 1. DATABASE CONNECT
connectDB();

// 2. MIDDLEWARE
app.use(cors({
    // ✅ UPDATE: Supporting local and production origins
    origin: ['http://localhost:5173', 'https://chrikitn-frontend.vercel.app', 'https://chrikitn.vercel.app'], 
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'], 
    allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token'],
    credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 3. STATIC SERVING
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 4. ROUTES
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes')); 

// ✅ PASSWORD RECOVERY PROTOCOL (NEW: OTP-based Reset)
app.use('/api/password', require('./routes/passwordRoutes'));

// ✅ FIX: LOAD BOTH ADMIN FILES
// Original admin logic (User Verification, etc.)
app.use('/api/admin-core', require('./routes/admin')); 
// New Dashboard logic (Stats)
app.use('/api/admin', require('./routes/adminRoutes')); 

app.use('/api/posts', require('./routes/postRoutes')); 
app.use('/api/vip', require('./routes/vipRoutes')); 

// ✅ ACCESS CONTROL PROTOCOL (NEW: Whitelist Management)
app.use('/api/access', require('./routes/accessRoutes'));

// ✅ Role Upgrade Protocol
app.use('/api/role-request', require('./routes/roleRequestRoutes'));

// ✅ MISSION HANDSHAKE SYSTEM (New Phase)
app.use('/api/requests', require('./routes/requestRoutes'));

// ✅ SECURE CHAT PROTOCOL
app.use('/api/chat', require('./routes/chatRoutes'));

// ✅ CONNECTION LIST PROTOCOL
app.use('/api/connections', require('./routes/connectionRoutes'));

// --- SOCKET.IO LOGIC (The Tunnel) ---
io.on('connection', (socket) => {
    console.log('📡 NEW OPERATIVE CONNECTED:', socket.id);

    // Join Private Mission Room
    socket.on('join_room', (roomId) => {
        socket.join(roomId);
        console.log(`🔒 OPERATIVE JOINED ROOM: ${roomId}`);
    });

    // Send/Receive Message
    socket.on('send_message', (data) => {
        // Broadcasts to everyone in the room EXCEPT the sender
        socket.to(data.chatRoomId).emit('receive_message', data);
    });

    socket.on('disconnect', () => {
        console.log('🔌 OPERATIVE DISCONNECTED');
    });
});

// 5. GLOBAL ERROR CATCHER (UPDATED: Diagnosing the 500 Error)
app.use((err, req, res, next) => {
    console.error('CRITICAL_SYSTEM_ERROR:', err); 
    res.status(500).json({ 
        success: false, 
        msg: 'Internal System Failure', 
        actualError: err.message, // This will reveal the culprit in your browser
        errorType: err.name 
    });
});

const PORT = process.env.PORT || 5000;
// Note: We use server.listen instead of app.listen to support Sockets
server.listen(PORT, () => {
    console.log(`🚀 TERMINAL ACTIVE ON PORT ${PORT}`);
    console.log(`📊 MAIN DASHBOARD PROTOCOL LIVE AT /api/admin`);
    console.log(`🛡️  ADMIN CORE PROTOCOL LIVE AT /api/admin-core`);
    console.log(`📡 VIP INTEL PROTOCOL LIVE AT /api/vip`);
    console.log(`📂 ROLE UPGRADE SYSTEM LIVE AT /api/role-request`);
    console.log(`🛰️  HANDSHAKE PROTOCOL LIVE AT /api/requests`);
    console.log(`💬 SECURE CHAT PROTOCOL LIVE AT /api/chat`);
    console.log(`🤝 CONNECTION PROTOCOL LIVE AT /api/connections`);
    console.log(`🔑 ACCESS CONTROL PROTOCOL LIVE AT /api/access`);
    console.log(`🔓 PASSWORD RECOVERY PROTOCOL LIVE AT /api/password`);
    console.log(`⚡ SOCKET.IO ENGINE ONLINE`);
});