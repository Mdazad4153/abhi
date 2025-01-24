// Socket connection
const socket = io('https://nothing-39bv.onrender.com/');

// DOM Elements
const chatContainer = document.getElementById('chat-container');
const messageForm = document.getElementById('message-form');
const messageInput = document.getElementById('message-input');
const chatMessages = document.getElementById('chat-messages');
const usersList = document.getElementById('users-list');
const fileInput = document.getElementById('file-input');
const typingIndicator = document.getElementById('typing-indicator');
const themeToggle = document.getElementById('theme-toggle');
const logoutButton = document.getElementById('logout');
const mobileMenu = document.getElementById('mobile-menu');
const sidebar = document.querySelector('.sidebar');

// State
let currentUser = null;
let typingTimeout = null;

// Function to format time
const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

// Check if user is logged in
window.addEventListener('load', () => {
    const userName = localStorage.getItem('userName');
    const userJoined = localStorage.getItem('userJoined');
    
    if (!userName || !userJoined) {
        window.location.href = 'enter.html';
        return;
    }

    // Create user object
    currentUser = {
        _id: Date.now().toString(),
        username: userName
    };

    // Display user name in header
    document.getElementById('current-user-name').textContent = userName;

    // Connect to chat
    socket.emit('user:join', currentUser);
});

// Logout functionality
logoutButton.addEventListener('click', () => {
    localStorage.removeItem('userName');
    localStorage.removeItem('userJoined');
    window.location.href = 'enter.html';
});

// Theme Management
const toggleTheme = () => {
    document.body.classList.toggle('dark-mode');
    document.body.classList.toggle('light-mode');
    const isDark = document.body.classList.contains('dark-mode');
    themeToggle.innerHTML = isDark ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
};

// Load saved theme
if (localStorage.getItem('theme') === 'dark') {
    toggleTheme();
}

themeToggle.addEventListener('click', toggleTheme);

// Append message to chat
const appendMessage = (message, isSent = false) => {
    const messageDiv = document.createElement('div');
    
    // Handle system messages differently
    if (message.type === 'system') {
        messageDiv.className = 'message system';
        const content = document.createElement('div');
        content.className = 'system-message';
        content.textContent = message.content;
        messageDiv.appendChild(content);
    } else {
        messageDiv.className = `message ${isSent ? 'sent' : 'received'}`;
        
        // Add sender name
        const senderName = document.createElement('div');
        senderName.className = 'sender-name';
        senderName.textContent = isSent ? currentUser.username : message.senderName;
        
        const messageWrapper = document.createElement('div');
        messageWrapper.className = 'message-wrapper';
        
        const content = document.createElement('div');
        content.className = 'message-content';
        
        if (message.type === 'image') {
            const img = document.createElement('img');
            img.src = message.content;
            img.className = 'shared-image';
            content.appendChild(img);
        } else {
            content.textContent = message.content;
        }
        
        const timestamp = document.createElement('div');
        timestamp.className = 'message-time';
        timestamp.textContent = formatTime(message.timestamp || Date.now());
        
        messageWrapper.appendChild(content);
        messageWrapper.appendChild(timestamp);
        
        messageDiv.appendChild(senderName);
        messageDiv.appendChild(messageWrapper);
    }
    
    chatMessages.appendChild(messageDiv);
    
    // Smooth scroll to bottom
    chatMessages.scrollTo({
        top: chatMessages.scrollHeight,
        behavior: 'smooth'
    });
    
    // Clear input after sending
    if (isSent) {
        messageInput.value = '';
        messageInput.focus();
    }
};

// Message Form Submission
messageForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const message = messageInput.value.trim();
    if (message) {
        const messageData = {
            content: message,
            sender: currentUser._id,
            senderName: currentUser.username,
            type: 'text',
            timestamp: Date.now()
        };
        socket.emit('message:send', messageData);
        appendMessage(messageData, true);
    }
});

// File Upload
fileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const messageData = {
                content: e.target.result,
                sender: currentUser._id,
                senderName: currentUser.username,
                type: 'image',
                timestamp: Date.now()
            };
            socket.emit('message:send', messageData);
            appendMessage(messageData, true);
        };
        reader.readAsDataURL(file);
    }
});

// Typing Indicator
messageInput.addEventListener('input', () => {
    socket.emit('typing:start', { userId: currentUser._id });
    
    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => {
        socket.emit('typing:stop', { userId: currentUser._id });
    }, 1000);
});

// Mobile menu toggle
mobileMenu.addEventListener('click', () => {
    sidebar.classList.toggle('show');
});

// Close sidebar when clicking outside on mobile
document.addEventListener('click', (e) => {
    if (window.innerWidth <= 768) {
        if (!sidebar.contains(e.target) && !mobileMenu.contains(e.target)) {
            sidebar.classList.remove('show');
        }
    }
});

// Close sidebar when window is resized above mobile breakpoint
window.addEventListener('resize', () => {
    if (window.innerWidth > 768) {
        sidebar.classList.remove('show');
    }
});

// Socket Event Handlers
socket.on('message:received', (message) => {
    if (message.sender !== currentUser._id) {
        appendMessage(message, false);
    }
});

socket.on('users:update', (users) => {
    usersList.innerHTML = '';
    users.forEach(user => {
        if (user._id !== currentUser._id) {
            const userDiv = document.createElement('div');
            userDiv.className = 'user-item';
            userDiv.innerHTML = `
                <span class="status-dot online"></span>
                <span>${user.username}</span>
            `;
            usersList.appendChild(userDiv);
        }
    });
});

socket.on('user:typing', (data) => {
    if (data.userId !== currentUser._id) {
        typingIndicator.textContent = `${data.username} is typing...`;
        typingIndicator.classList.remove('d-none');
        typingIndicator.classList.add('show');
    }
});

socket.on('user:stop-typing', (data) => {
    if (data.userId !== currentUser._id) {
        typingIndicator.classList.remove('show');
        setTimeout(() => {
            typingIndicator.classList.add('d-none');
        }, 300);
    }
});
