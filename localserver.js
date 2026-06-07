const express = require('express');
const os = require('os'); // Built-in Node module to get system info

const app = express();
const PORT = 3000;
const HOST = '0.0.0.0'; // Listens on all network interfaces

// Middleware to parse JSON and text data
app.use(express.json());
app.use(express.text());

// Function to automatically find your computer's local network IP address
function getLocalIPAddress() {
    const interfaces = os.networkInterfaces();
    for (const interfaceName in interfaces) {
        for (const networkInterface of interfaces[interfaceName]) {
            // Skip over internal loopback addresses like 127.0.0.1 and look for IPv4
            if (networkInterface.family === 'IPv4' && !networkInterface.internal) {
                return networkInterface.address;
            }
        }
    }
    return 'localhost'; // Fallback if no network connection is active
}

const localIP = getLocalIPAddress();

// Simple GET route to test connection
app.get('/', (req, res) => {
    res.send('Successfully connected to the local server wirelessly!');
});

// POST route to handle incoming data from your phone
app.post('/data', (req, res) => {
    console.log('--- Incoming Data from Phone ---');
    console.log('Body:', req.body);
    res.status(200).json({ status: 'success', message: 'Data received locally!' });
});

app.listen(PORT, HOST, () => {
    console.log(`\n==================================================`);
    console.log(` Server running locally on your wireless network!`);
    console.log(` Open your phone browser and type this exact URL:`);
    console.log(` http://${localIP}:${PORT}`);
    console.log(`==================================================\n`);
});