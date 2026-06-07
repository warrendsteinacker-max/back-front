const express = require('express');
const os = require('os');
const path = require('path');
const app = express();

const PORT = 3000;
const HOST = '0.0.0.0'; 

app.use(express.json());
app.use(express.text());

// Setup open CORS rules so your phone can make a secure handshake with your PC hardware
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    if (req.method === 'OPTIONS') return res.sendStatus(200);
    next();
});

function getRealWirelessIP() {
    const interfaces = os.networkInterfaces();
    let fallback = 'localhost';

    for (const interfaceName in interfaces) {
        if (interfaceName.toLowerCase().includes('vbox') || 
            interfaceName.toLowerCase().includes('virtual') || 
            interfaceName.toLowerCase().includes('wsl')) {
            continue;
        }
        for (const net of interfaces[interfaceName]) {
            if (net.family === 'IPv4' && !net.internal) {
                if (net.address.startsWith('192.168.') || net.address.startsWith('172.')) {
                    return net.address;
                }
                fallback = net.address;
            }
        }
    }
    return fallback;
}

const localIP = getRealWirelessIP();

// Delivers your updated front-end view right to your phone browser automatically
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Dedicated route to instantly test if a local phone device can bypass the firewall
app.get('/api/ping', (req, res) => {
    res.status(200).json({ status: 'online', message: 'Handshake complete!' });
});

// Primary logging destination route for scanner syncs
app.post('/api/sync', (req, res) => {
    console.log('\n==================================================');
    console.log('📬 INCOMING TRACKER PAYLOAD RECEIVED');
    console.log('Action Type:', req.body.action);
    console.log('Item Identity:', req.body.item.name);
    console.log('Barcode:', req.body.item.barcode);
    console.log('Timestamp:', req.body.item.timestamp);
    console.log('==================================================\n');
    
    res.status(200).json({ status: 'success', message: 'Data logged to terminal!' });
});

app.listen(PORT, HOST, () => {
    console.log(`\n==================================================`);
    console.log(` 💻 SERVER LIVE AND READY FOR TESTING`);
    console.log(` 1. Connect your phone to the same local Wi-Fi/Hotspot network.`);
    console.log(` 2. On your mobile browser, go to this exact address:`);
    console.log(`    http://${localIP}:${PORT}`);
    console.log(`==================================================\n`);
});