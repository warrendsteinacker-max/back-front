const express = require('express');
const os = require('os');
const path = require('path');
const app = express();

const PORT = 3000;
const HOST = '0.0.0.0'; // Listens on all available local network interfaces

// Middleware to parse incoming payloads from your phone
app.use(express.json());
app.use(express.text());

// Open CORS policy to allow your local phone browser to talk to your computer hardware
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    if (req.method === 'OPTIONS') return res.sendStatus(200);
    next();
});

/**
 * Dynamically finds your computer's actual active wireless network adapter IP address.
 * Fixed to dynamically catch all active non-internal IPv4 profiles (including 100.x.x.x virtual/carrier networks).
 */
function getRealWirelessIP() {
    const interfaces = os.networkInterfaces();
    let fallback = 'localhost';

    for (const interfaceName in interfaces) {
        // Skip common local background loops that block external devices
        if (interfaceName.toLowerCase().includes('vbox') || 
            interfaceName.toLowerCase().includes('virtual') || 
            interfaceName.toLowerCase().includes('wsl')) {
            continue;
        }
        for (const net of interfaces[interfaceName]) {
            if (net.family === 'IPv4' && !net.internal) {
                // Returns the first active physical network interface address found
                return net.address;
            }
        }
    }
    return fallback;
}

const localIP = getRealWirelessIP();

// Delivers your app view directly to your phone's browser when it hits the base URL
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Diagnostic route used by your app's yellow testing button
app.get('/api/ping', (req, res) => {
    res.status(200).json({ status: 'online', message: 'Handshake complete!' });
});

// Main landing route for tracking barcoded item submissions
app.post('/api/sync', (req, res) => {
    console.log('\n==================================================');
    console.log('📬 INCOMING TRACKER PAYLOAD RECEIVED');
    console.log('Action Type:', req.body.action);
    console.log('Item Identity:', req.body.item ? req.body.item.name : 'Unknown');
    console.log('Barcode:', req.body.item ? req.body.item.barcode : 'Unknown');
    console.log('Timestamp:', req.body.item ? req.body.item.timestamp : new Date().toLocaleString());
    console.log('==================================================\n');
    
    res.status(200).json({ status: 'success', message: 'Data logged to terminal!' });
});

// Starts the server listener engine
app.listen(PORT, HOST, () => {
    console.log(`\n==================================================`);
    console.log(` 💻 SERVER LIVE AND READY FOR TESTING`);
    console.log(` 1. Connect your phone to the same local Wi-Fi/Hotspot network.`);
    console.log(` 2. On your mobile browser, go to this exact address:`);
    console.log(`    http://${localIP}:${PORT}`);
    console.log(`==================================================\n`);
});