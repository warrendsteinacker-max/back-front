



//////gemai

// const express = require('express');
// const os = require('os');
// const path = require('path');
// const app = express();

// const PORT = 3000;
// const HOST = '0.0.0.0'; // Listens on all available local network interfaces

// // Middleware to parse incoming payloads from your phone
// app.use(express.json());
// app.use(express.text());

// // Open CORS policy to allow your local phone browser to talk to your computer hardware
// app.use((req, res, next) => {
//     res.setHeader('Access-Control-Allow-Origin', '*');
//     res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
//     res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
//     if (req.method === 'OPTIONS') return res.sendStatus(200);
//     next();
// });

// /**
//  * Dynamically finds your computer's actual active wireless network adapter IP address.
//  * Fixed to dynamically catch all active non-internal IPv4 profiles (including 100.x.x.x virtual/carrier networks).
//  */
// function getRealWirelessIP() {
//     const interfaces = os.networkInterfaces();
//     let fallback = 'localhost';

//     for (const interfaceName in interfaces) {
//         // Skip common local background loops that block external devices
//         if (interfaceName.toLowerCase().includes('vbox') || 
//             interfaceName.toLowerCase().includes('virtual') || 
//             interfaceName.toLowerCase().includes('wsl')) {
//             continue;
//         }
//         for (const net of interfaces[interfaceName]) {
//             if (net.family === 'IPv4' && !net.internal) {
//                 // Returns the first active physical network interface address found
//                 return net.address;
//             }
//         }
//     }
//     return fallback;
// }

// const localIP = getRealWirelessIP();

// // Delivers your app view directly to your phone's browser when it hits the base URL
// app.get('/', (req, res) => {
//     res.sendFile(path.join(__dirname, 'index.html'));
// });

// // Diagnostic route used by your app's yellow testing button
// app.get('/api/ping', (req, res) => {
//     res.status(200).json({ status: 'online', message: 'Handshake complete!' });
// });

// // Main landing route for tracking barcoded item submissions
// app.post('/api/sync', (req, res) => {
//     console.log('\n==================================================');
//     console.log('📬 INCOMING TRACKER PAYLOAD RECEIVED');
//     console.log('Action Type:', req.body.action);
//     console.log('Item Identity:', req.body.item ? req.body.item.name : 'Unknown');
//     console.log('Barcode:', req.body.item ? req.body.item.barcode : 'Unknown');
//     console.log('Timestamp:', req.body.item ? req.body.item.timestamp : new Date().toLocaleString());
//     console.log('==================================================\n');
    
//     res.status(200).json({ status: 'success', message: 'Data logged to terminal!' });
// });

// // Starts the server listener engine
// app.listen(PORT, HOST, () => {
//     console.log(`\n==================================================`);
//     console.log(` 💻 SERVER LIVE AND READY FOR TESTING`);
//     console.log(` 1. Connect your phone to the same local Wi-Fi/Hotspot network.`);
//     console.log(` 2. On your mobile browser, go to this exact address:`);
//     console.log(`    http://${localIP}:${PORT}`);
//     console.log(`==================================================\n`);
// });







// cluad




const express = require('express');
const os = require('os');
const path = require('path');
const app = express();

const PORT = 3000;
const HOST = '0.0.0.0';

// ============================================================
// IN-MEMORY DATABASE (persists while server is running)
// ============================================================
let db = {
  inventory: [],   // Master item dictionary
  purchases: [],   // Every purchase log entry
  scans: []        // Raw scan history (every scan event, timestamped)
};

// ============================================================
// GLOBAL REQUEST LOGGER — prints every hit to terminal
// ============================================================
app.use((req, res, next) => {
  const t = new Date().toLocaleTimeString();
  console.log(`\n[${t}] 📡 ${req.method} ${req.url}  FROM: ${req.ip || req.socket.remoteAddress}`);
  next();
});

// ============================================================
// MIDDLEWARE
// ============================================================
app.use(express.json());
app.use(express.text());

// Open CORS — required so any phone on your network can talk to this server
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') {
    console.log('   ↳ 🔓 CORS preflight approved');
    return res.sendStatus(200);
  }
  next();
});

// ============================================================
// IP DETECTION — finds your real LAN IP (works for 192.168.x, 172.x, 100.x, 10.x)
// ============================================================
function getLocalIP() {
  const ifaces = os.networkInterfaces();
  for (const name in ifaces) {
    if (/vbox|virtual|wsl|loopback/i.test(name)) continue;
    for (const net of ifaces[name]) {
      if (net.family === 'IPv4' && !net.internal) return net.address;
    }
  }
  return 'localhost';
}
const localIP = getLocalIP();

// ============================================================
// SERVE FRONTEND
// ============================================================
app.get('/', (req, res) => {
  console.log('   ↳ 📄 Serving index.html to browser');
  res.sendFile(path.join(__dirname, 'index.html'));
});

// ============================================================
// PING — connection test
// ============================================================
app.get('/api/ping', (req, res) => {
  console.log('   ↳ ✅ Ping successful');
  res.json({ status: 'online', message: 'Server is reachable!', ip: localIP, port: PORT });
});

// ============================================================
// INVENTORY ROUTES
// ============================================================

// GET all inventory items
app.get('/api/inventory', (req, res) => {
  console.log(`   ↳ 📦 Sending ${db.inventory.length} inventory items`);
  res.json(db.inventory);
});

// POST — add or update an inventory item
app.post('/api/inventory', (req, res) => {
  const { barcode, name } = req.body;
  if (!barcode || !name) return res.status(400).json({ error: 'barcode and name required' });

  const existing = db.inventory.find(i => i.barcode === barcode);
  if (existing) {
    existing.name = name;
    existing.updatedAt = new Date().toISOString();
    console.log(`   ↳ ✏️  Updated inventory item: ${name} (${barcode})`);
    return res.json({ action: 'updated', item: existing });
  }

  const item = { id: `inv_${Date.now()}`, barcode, name, createdAt: new Date().toISOString() };
  db.inventory.unshift(item);
  console.log(`   ↳ ➕ Added to inventory: ${name} (${barcode})`);
  printDB();
  res.status(201).json({ action: 'created', item });
});

// DELETE inventory item by id
app.delete('/api/inventory/:id', (req, res) => {
  const before = db.inventory.length;
  db.inventory = db.inventory.filter(i => i.id !== req.params.id);
  if (db.inventory.length === before) return res.status(404).json({ error: 'Item not found' });
  console.log(`   ↳ 🗑️  Deleted inventory item: ${req.params.id}`);
  res.json({ status: 'deleted' });
});

// ============================================================
// PURCHASE LOG ROUTES
// ============================================================

// GET all purchases
app.get('/api/purchases', (req, res) => {
  console.log(`   ↳ 🛒 Sending ${db.purchases.length} purchase records`);
  res.json(db.purchases);
});

// POST — log a purchase
app.post('/api/purchases', (req, res) => {
  const { barcode, name } = req.body;
  if (!barcode || !name) return res.status(400).json({ error: 'barcode and name required' });

  const entry = { id: `pur_${Date.now()}`, barcode, name, loggedAt: new Date().toISOString() };
  db.purchases.unshift(entry);

  // Auto-add to inventory dictionary if not there yet
  if (!db.inventory.find(i => i.barcode === barcode)) {
    db.inventory.unshift({ id: `inv_${Date.now()}`, barcode, name, createdAt: new Date().toISOString() });
    console.log(`   ↳ 📦 Auto-added to inventory: ${name}`);
  }

  console.log(`   ↳ 🛒 Purchase logged: ${name} (${barcode})`);
  printDB();
  res.status(201).json({ action: 'logged', entry });
});

// DELETE purchase by id
app.delete('/api/purchases/:id', (req, res) => {
  const before = db.purchases.length;
  db.purchases = db.purchases.filter(i => i.id !== req.params.id);
  if (db.purchases.length === before) return res.status(404).json({ error: 'Entry not found' });
  console.log(`   ↳ 🗑️  Deleted purchase: ${req.params.id}`);
  res.json({ status: 'deleted' });
});

// ============================================================
// RAW SCAN LOG
// ============================================================

// GET all scan events
app.get('/api/scans', (req, res) => {
  console.log(`   ↳ 📷 Sending ${db.scans.length} scan events`);
  res.json(db.scans);
});

// POST — record a raw scan event
app.post('/api/scans', (req, res) => {
  const { barcode } = req.body;
  if (!barcode) return res.status(400).json({ error: 'barcode required' });

  const scan = { id: `scan_${Date.now()}`, barcode, scannedAt: new Date().toISOString() };
  db.scans.unshift(scan);
  console.log(`   ↳ 📷 Scan recorded: ${barcode}`);
  res.status(201).json(scan);
});

// ============================================================
// FULL DB SNAPSHOT
// ============================================================
app.get('/api/db', (req, res) => {
  console.log('   ↳ 🗄️  Full DB snapshot requested');
  res.json(db);
});

// Clear entire DB (useful for testing)
app.delete('/api/db', (req, res) => {
  db = { inventory: [], purchases: [], scans: [] };
  console.log('   ↳ 🧹 DB cleared');
  res.json({ status: 'cleared' });
});

// ============================================================
// 404 + ERROR HANDLER
// ============================================================
app.use((req, res) => {
  console.log(`   ⚠️  404: ${req.url} not found`);
  res.status(404).json({ error: `Route ${req.url} not found` });
});

app.use((err, req, res, next) => {
  console.error('   💥 SERVER ERROR:', err.message);
  res.status(500).json({ error: err.message });
});

// ============================================================
// START
// ============================================================
app.listen(PORT, HOST, () => {
  console.log('\n==================================================');
  console.log('  💻 SERVER LIVE');
  console.log(`  Local:   http://localhost:${PORT}`);
  console.log(`  Network: http://${localIP}:${PORT}  ← type this on your phone`);
  console.log('==================================================\n');
});

// Prints current DB state to terminal after every write
function printDB() {
  console.log('\n--- 🗄️  CURRENT DB STATE ---');
  console.log(`  Inventory: ${db.inventory.length} items`);
  console.log(`  Purchases: ${db.purchases.length} entries`);
  console.log(`  Scans:     ${db.scans.length} events`);
  console.log('----------------------------\n');
}