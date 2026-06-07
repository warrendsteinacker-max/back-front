const express = require('express');
const os = require('os');
const app = express();

const PORT = 3000;
const HOST = '0.0.0.0'; 

app.use(express.json());
app.use(express.text());

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    if (req.method === 'OPTIONS') return res.sendStatus(200);
    next();
});

// Strips away virtual adapter IPs (like 100.x.x.x) and targets real Wi-Fi hardware
function getRealWirelessIP() {
    const interfaces = os.networkInterfaces();
    let fallback = 'localhost';

    for (const interfaceName in interfaces) {
        // Ignore virtual networks completely
        if (interfaceName.toLowerCase().includes('vbox') || 
            interfaceName.toLowerCase().includes('virtual') || 
            interfaceName.toLowerCase().includes('wsl')) {
            continue;
        }

        for (const net of interfaces[interfaceName]) {
            if (net.family === 'IPv4' && !net.internal) {
                // Prioritize standard local Wi-Fi IP ranges
                if (net.address.startsWith('192.168.') || net.address.startsWith('172.')) {
                    return net.address;
                }
                fallback = net.address; // Keep searching but save this just in case
            }
        }
    }
    return fallback;
}

const localIP = getRealWirelessIP();

app.get('/', (req, res) => {
    res.send('Successfully connected to the local server wirelessly!');
});

app.post('/data', (req, res) => {
    console.log('--- Incoming Wireless Payload ---');
    console.log('Data:', req.body);
    res.status(200).json({ status: 'success', message: 'Data received locally!' });
});

app.listen(PORT, HOST, () => {
    console.log(`\n==================================================`);
    console.log(` SERVER LIVE ON YOUR LOCAL HOTSPOT`);
    console.log(` Tell them to connect to your computer's Wi-Fi hotpsot.`);
    console.log(` Then open the local HTML file and target:`);
    console.log(` http://${localIP}:${PORT}`);
    console.log(`==================================================\n`);
});