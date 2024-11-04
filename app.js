const socket = new WebSocket('ws://localhost:3000'); // Change to wss:// if using HTTPS
const messagesDiv = document.getElementById('messages');
const messageInput = document.getElementById('message-input');
const sendButton = document.getElementById('send-button');

// Function to generate a random username
function generateRandomUsername() {
    const adjectives = ['Cool', 'Brave', 'Silly', 'Wise', 'Funky'];
    const nouns = ['Cat', 'Dog', 'Lion', 'Tiger', 'Dragon'];
    return `${adjectives[Math.floor(Math.random() * adjectives.length)]}${nouns[Math.floor(Math.random() * nouns.length)]}${Math.floor(Math.random() * 100)}`;
}

let username = generateRandomUsername(); // Generate a random username
console.log('Your username:', username); // Log the username for reference

const messageHistory = []; // Array to hold messages

// Handle incoming messages
socket.onmessage = function(event) {
    let message;

    // Check if the message is a Blob
    if (event.data instanceof Blob) {
        const reader = new FileReader();
        reader.onload = function() {
            message = reader.result; // This will be the string message
            displayMessage(message);
        };
        reader.readAsText(event.data); // Read the Blob as text
    } else {
        // Assume it's a string
        message = typeof event.data === 'string' ? event.data : new TextDecoder().decode(event.data);
        displayMessage(message);
    }
};

function displayMessage(message) {
    const timestamp = new Date().getTime();
    const [user, text] = message.split(': ');

    // Display the message regardless of sender for incoming messages
    const messageElement = document.createElement('div');
    messageElement.textContent = `${user}: ${text}`;
    messagesDiv.appendChild(messageElement);

    // Store messages from other users
    if (user !== username) {
        messageHistory.push({ user, message: text, timestamp });
    }

    // Filter messages older than 1 minute
    const filteredMessages = messageHistory.filter(msg => (timestamp - msg.timestamp) <= 60 * 1000);
    
    // Clear existing messages and re-display filtered messages
    messagesDiv.innerHTML = ''; 
    filteredMessages.forEach(msg => {
        const messageElement = document.createElement('div');
        messageElement.textContent = `${msg.user}: ${msg.message}`;
        messagesDiv.appendChild(messageElement);
    });

    messagesDiv.scrollTop = messagesDiv.scrollHeight; // Auto-scroll to the bottom
}

// Handle WebSocket connection open
socket.onopen = function() {
    console.log('Connected to the WebSocket server');
};

// Handle WebSocket errors
socket.onerror = function(error) {
    console.error('WebSocket error:', error);
};

// Handle WebSocket connection close
socket.onclose = function() {
    console.log('Disconnected from the WebSocket server');
};

// Send message on button click
sendButton.onclick = function() {
    const message = messageInput.value.trim(); // Get the input value and trim whitespace
    if (message) {
        const fullMessage = `${username}: ${message}`; // Include username in the message
        console.log('Sending:', fullMessage, 'Type:', typeof fullMessage); // Log the message and its type
        socket.send(fullMessage); // Send the string message

        // Store user messages with timestamp
        const timestamp = new Date().getTime();
        messageHistory.push({ user: username, message, timestamp });

        // Display the sent message immediately
        displayMessage(fullMessage);

        messageInput.value = ''; // Clear input after sending
    } else {
        console.log('Cannot send empty message'); // Log if trying to send an empty message
    }
};

// Send message on Enter key press
messageInput.addEventListener('keypress', function(event) {
    if (event.key === 'Enter') {
        sendButton.click(); // Trigger the send button click
    }
});
