const express = require('express');
const os = require('os');
const app = express();

const PORT = 3000;
const HOST = '0.0.0.0'; 

// Parse incoming data payloads
app.use(express.json());
app.use(express.text());

// CORS configuration to prevent browser blockages
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    if (req.method === 'OPTIONS') return res.sendStatus(200);
    next();
});

// Simple landing route
app.get('/', (req, res) => {
    res.send('Successfully connected to the local server wirelessly!');
});

// POST endpoint where your frontend file sends data
app.post('/data', (req, res) => {
    console.log('--- Incoming Wireless Payload ---');
    console.log('Data:', req.body);
    res.status(200).json({ status: 'success', message: 'Data received locally!' });
});

app.listen(PORT, HOST, () => {
    console.log(`\n==================================================`);
    console.log(` Server is live and listening wirelessly!`);
    console.log(` Ready to receive traffic on port ${PORT}`);
    console.log(`==================================================\n`);
});