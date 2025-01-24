const express = require('express');
const cors = require('cors');
const http = require('http').createServer(express());
const io = require('socket.io')(http, {
    cors: {
        origin: "https://10thbook.netlify.app",
        methods: ["GET", "POST"]
    }
});

const app = express();
app.use(cors({ 
    origin: 'https://10thbook.netlify.app',
    methods: ['GET', 'POST'],
    credentials: true
}));
app.use(express.json());
app.use(express.static(__dirname));

// Store active users
let activeUsers = new Map();

// Socket.io connection handling
io.on('connection', (socket) => {
    console.log('A user connected');

    // Handle user joining
    socket.on('user:join', (user) => {
        activeUsers.set(socket.id, user);
        // Broadcast to all users that someone joined
        io.emit('users:update', Array.from(activeUsers.values()));
        // Send welcome message
        socket.broadcast.emit('message:received', {
            content: `${user.username} joined the chat`,
            type: 'system',
            timestamp: Date.now()
        });
    });

    // Handle messages
    socket.on('message:send', (message) => {
        const user = activeUsers.get(socket.id);
        if (user) {
            // Add user info to message
            message.senderName = user.username;
            // Broadcast to all users
            io.emit('message:received', message);
        }
    });

    // Handle typing status
    socket.on('typing:start', (data) => {
        const user = activeUsers.get(socket.id);
        if (user) {
            socket.broadcast.emit('user:typing', {
                userId: user._id,
                username: user.username
            });
        }
    });

    socket.on('typing:stop', (data) => {
        const user = activeUsers.get(socket.id);
        if (user) {
            socket.broadcast.emit('user:stop-typing', {
                userId: user._id,
                username: user.username
            });
        }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
        const user = activeUsers.get(socket.id);
        if (user) {
            // Remove user from active users
            activeUsers.delete(socket.id);
            // Update all clients with new user list
            io.emit('users:update', Array.from(activeUsers.values()));
            // Send disconnect message
            io.emit('message:received', {
                content: `${user.username} left the chat`,
                type: 'system',
                timestamp: Date.now()
            });
        }
        console.log('A user disconnected');
    });
});

// Start server
const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
