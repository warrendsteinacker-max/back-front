// import express from 'express';
const express = require('express')
const app = express();
// Using 0.0.0.0 tells the server to listen on all network interfaces (Localhost AND your Local IP)
const PORT = 3000;
const HOST = '0.0.0.0'; 

// Middleware to parse JSON and text data
app.use(express.json());
app.use(express.text());

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
    console.log(`Server running locally.`);
    console.log(`Target Address for your phone: http://YOUR_COMPUTER_IP:${PORT}`);
});