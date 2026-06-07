



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







// cluad sever with front





// const express = require('express');
// const os = require('os');
// const path = require('path');
// const app = express();

// const PORT = 3000;
// const HOST = '0.0.0.0';

// // ============================================================
// // IN-MEMORY DATABASE (persists while server is running)
// // ============================================================
// let db = {
//   inventory: [],   // Master item dictionary
//   purchases: [],   // Every purchase log entry
//   scans: []        // Raw scan history (every scan event, timestamped)
// };

// // ============================================================
// // GLOBAL REQUEST LOGGER — prints every hit to terminal
// // ============================================================
// app.use((req, res, next) => {
//   const t = new Date().toLocaleTimeString();
//   console.log(`\n[${t}] 📡 ${req.method} ${req.url}  FROM: ${req.ip || req.socket.remoteAddress}`);
//   next();
// });

// // ============================================================
// // MIDDLEWARE
// // ============================================================
// app.use(express.json());
// app.use(express.text());

// // Open CORS — required so any phone on your network can talk to this server
// app.use((req, res, next) => {
//   res.setHeader('Access-Control-Allow-Origin', '*');
//   res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
//   res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
//   if (req.method === 'OPTIONS') {
//     console.log('   ↳ 🔓 CORS preflight approved');
//     return res.sendStatus(200);
//   }
//   next();
// });

// // ============================================================
// // IP DETECTION — finds your real LAN IP (works for 192.168.x, 172.x, 100.x, 10.x)
// // ============================================================
// function getLocalIP() {
//   const ifaces = os.networkInterfaces();
//   for (const name in ifaces) {
//     if (/vbox|virtual|wsl|loopback/i.test(name)) continue;
//     for (const net of ifaces[name]) {
//       if (net.family === 'IPv4' && !net.internal) return net.address;
//     }
//   }
//   return 'localhost';
// }
// const localIP = getLocalIP();

// // ============================================================
// // SERVE FRONTEND
// // ============================================================
// app.get('/', (req, res) => {
//   console.log('   ↳ 📄 Serving index.html to browser');
//   res.sendFile(path.join(__dirname, 'index.html'));
// });

// // ============================================================
// // PING — connection test
// // ============================================================
// app.get('/api/ping', (req, res) => {
//   console.log('   ↳ ✅ Ping successful');
//   res.json({ status: 'online', message: 'Server is reachable!', ip: localIP, port: PORT });
// });

// // ============================================================
// // INVENTORY ROUTES
// // ============================================================

// // GET all inventory items
// app.get('/api/inventory', (req, res) => {
//   console.log(`   ↳ 📦 Sending ${db.inventory.length} inventory items`);
//   res.json(db.inventory);
// });

// // POST — add or update an inventory item
// app.post('/api/inventory', (req, res) => {
//   const { barcode, name } = req.body;
//   if (!barcode || !name) return res.status(400).json({ error: 'barcode and name required' });

//   const existing = db.inventory.find(i => i.barcode === barcode);
//   if (existing) {
//     existing.name = name;
//     existing.updatedAt = new Date().toISOString();
//     console.log(`   ↳ ✏️  Updated inventory item: ${name} (${barcode})`);
//     return res.json({ action: 'updated', item: existing });
//   }

//   const item = { id: `inv_${Date.now()}`, barcode, name, createdAt: new Date().toISOString() };
//   db.inventory.unshift(item);
//   console.log(`   ↳ ➕ Added to inventory: ${name} (${barcode})`);
//   printDB();
//   res.status(201).json({ action: 'created', item });
// });

// // DELETE inventory item by id
// app.delete('/api/inventory/:id', (req, res) => {
//   const before = db.inventory.length;
//   db.inventory = db.inventory.filter(i => i.id !== req.params.id);
//   if (db.inventory.length === before) return res.status(404).json({ error: 'Item not found' });
//   console.log(`   ↳ 🗑️  Deleted inventory item: ${req.params.id}`);
//   res.json({ status: 'deleted' });
// });

// // ============================================================
// // PURCHASE LOG ROUTES
// // ============================================================

// // GET all purchases
// app.get('/api/purchases', (req, res) => {
//   console.log(`   ↳ 🛒 Sending ${db.purchases.length} purchase records`);
//   res.json(db.purchases);
// });

// // POST — log a purchase
// app.post('/api/purchases', (req, res) => {
//   const { barcode, name } = req.body;
//   if (!barcode || !name) return res.status(400).json({ error: 'barcode and name required' });

//   const entry = { id: `pur_${Date.now()}`, barcode, name, loggedAt: new Date().toISOString() };
//   db.purchases.unshift(entry);

//   // Auto-add to inventory dictionary if not there yet
//   if (!db.inventory.find(i => i.barcode === barcode)) {
//     db.inventory.unshift({ id: `inv_${Date.now()}`, barcode, name, createdAt: new Date().toISOString() });
//     console.log(`   ↳ 📦 Auto-added to inventory: ${name}`);
//   }

//   console.log(`   ↳ 🛒 Purchase logged: ${name} (${barcode})`);
//   printDB();
//   res.status(201).json({ action: 'logged', entry });
// });

// // DELETE purchase by id
// app.delete('/api/purchases/:id', (req, res) => {
//   const before = db.purchases.length;
//   db.purchases = db.purchases.filter(i => i.id !== req.params.id);
//   if (db.purchases.length === before) return res.status(404).json({ error: 'Entry not found' });
//   console.log(`   ↳ 🗑️  Deleted purchase: ${req.params.id}`);
//   res.json({ status: 'deleted' });
// });

// // ============================================================
// // RAW SCAN LOG
// // ============================================================

// // GET all scan events
// app.get('/api/scans', (req, res) => {
//   console.log(`   ↳ 📷 Sending ${db.scans.length} scan events`);
//   res.json(db.scans);
// });

// // POST — record a raw scan event
// app.post('/api/scans', (req, res) => {
//   const { barcode } = req.body;
//   if (!barcode) return res.status(400).json({ error: 'barcode required' });

//   const scan = { id: `scan_${Date.now()}`, barcode, scannedAt: new Date().toISOString() };
//   db.scans.unshift(scan);
//   console.log(`   ↳ 📷 Scan recorded: ${barcode}`);
//   res.status(201).json(scan);
// });

// // ============================================================
// // FULL DB SNAPSHOT
// // ============================================================
// app.get('/api/db', (req, res) => {
//   console.log('   ↳ 🗄️  Full DB snapshot requested');
//   res.json(db);
// });

// // Clear entire DB (useful for testing)
// app.delete('/api/db', (req, res) => {
//   db = { inventory: [], purchases: [], scans: [] };
//   console.log('   ↳ 🧹 DB cleared');
//   res.json({ status: 'cleared' });
// });

// // ============================================================
// // 404 + ERROR HANDLER
// // ============================================================
// app.use((req, res) => {
//   console.log(`   ⚠️  404: ${req.url} not found`);
//   res.status(404).json({ error: `Route ${req.url} not found` });
// });

// app.use((err, req, res, next) => {
//   console.error('   💥 SERVER ERROR:', err.message);
//   res.status(500).json({ error: err.message });
// });

// // ============================================================
// // START
// // ============================================================
// app.listen(PORT, HOST, () => {
//   console.log('\n==================================================');
//   console.log('  💻 SERVER LIVE');
//   console.log(`  Local:   http://localhost:${PORT}`);
//   console.log(`  Network: http://${localIP}:${PORT}  ← type this on your phone`);
//   console.log('==================================================\n');
// });

// // Prints current DB state to terminal after every write
// function printDB() {
//   console.log('\n--- 🗄️  CURRENT DB STATE ---');
//   console.log(`  Inventory: ${db.inventory.length} items`);
//   console.log(`  Purchases: ${db.purchases.length} entries`);
//   console.log(`  Scans:     ${db.scans.length} events`);
//   console.log('----------------------------\n');
// }



















// http code

// const express = require('express');
// const os = require('os');
// const path = require('path');
// const app = express();

// const PORT = 3000;
// const HOST = '0.0.0.0';

// // ============================================================
// // IN-MEMORY DATABASE
// // ============================================================
// let db = {
//   inventory: [],
//   purchases: [],
//   scans: []
// };

// // ============================================================
// // IP DETECTION
// // ============================================================
// function getLocalIP() {
//   const ifaces = os.networkInterfaces();
//   console.log('\n[STARTUP] Scanning network interfaces...');
//   for (const name in ifaces) {
//     for (const net of ifaces[name]) {
//       console.log(`  Interface: ${name} | Address: ${net.address} | Internal: ${net.internal} | Family: ${net.family}`);
//     }
//   }

//   // PRIORITY 1: Real Wi-Fi (192.168.x.x) — what your phone needs
//   for (const name in ifaces) {
//     for (const net of ifaces[name]) {
//       if (net.family === 'IPv4' && !net.internal && net.address.startsWith('192.168.')) {
//         console.log(`  [SELECTED] Wi-Fi IP: ${net.address} from interface: ${name}`);
//         return net.address;
//       }
//     }
//   }

//   // PRIORITY 2: PC hotspot subnet (192.168.137.x)
//   for (const name in ifaces) {
//     for (const net of ifaces[name]) {
//       if (net.family === 'IPv4' && !net.internal && net.address.startsWith('192.168.137.')) {
//         console.log(`  [SELECTED] Hotspot IP: ${net.address} from interface: ${name}`);
//         return net.address;
//       }
//     }
//   }

//   // PRIORITY 3: Any 10.x.x.x
//   for (const name in ifaces) {
//     for (const net of ifaces[name]) {
//       if (net.family === 'IPv4' && !net.internal && net.address.startsWith('10.')) {
//         console.log(`  [SELECTED] 10.x IP: ${net.address} from interface: ${name}`);
//         return net.address;
//       }
//     }
//   }

//   // LAST RESORT: anything that isn't Tailscale (100.x)
//   for (const name in ifaces) {
//     if (/tailscale/i.test(name)) continue;
//     for (const net of ifaces[name]) {
//       if (net.family === 'IPv4' && !net.internal) {
//         console.log(`  [SELECTED] Fallback IP: ${net.address} from interface: ${name}`);
//         return net.address;
//       }
//     }
//   }

//   console.log('  [FALLBACK] No usable IP found, using localhost');
//   return 'localhost';
// }

// const localIP = getLocalIP();

// // ============================================================
// // GLOBAL REQUEST LOGGER — fires on every single incoming request
// // ============================================================
// app.use((req, res, next) => {
//   const t = new Date().toLocaleTimeString();
//   console.log(`\n${'='.repeat(55)}`);
//   console.log(`[${t}] INCOMING REQUEST`);
//   console.log(`  Method:  ${req.method}`);
//   console.log(`  URL:     ${req.url}`);
//   console.log(`  From IP: ${req.ip || req.socket.remoteAddress}`);
//   console.log(`  Headers: Content-Type = ${req.headers['content-type'] || 'none'}`);

//   // Intercept the response to log what we sent back
//   const originalSend = res.send.bind(res);
//   res.send = function (body) {
//     console.log(`  Response: ${res.statusCode} ${typeof body === 'string' ? body.slice(0, 80) : '[object]'}`);
//     return originalSend(body);
//   };

//   next();
// });

// // ============================================================
// // MIDDLEWARE
// // ============================================================
// app.use(express.json());
// app.use(express.text());

// // CORS — open to all local devices
// app.use((req, res, next) => {
//   res.setHeader('Access-Control-Allow-Origin', '*');
//   res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
//   res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
//   if (req.method === 'OPTIONS') {
//     console.log('  [CORS] Preflight OPTIONS request — approved');
//     return res.sendStatus(200);
//   }
//   next();
// });

// // ============================================================
// // SERVE FRONTEND — this is why you don't need GitHub Pages
// // When any phone on the network goes to http://100.103.196.73:3000
// // this sends them the full index.html automatically
// // ============================================================
// app.get('/', (req, res) => {
//   // index.html lives in the frontend/ subfolder
//   const filePath = path.join(__dirname, 'frontend', 'index.html');
//   console.log(`  [FRONTEND] Serving index.html from: ${filePath}`);
//   res.sendFile(filePath, (err) => {
//     if (err) {
//       console.log(`  [ERROR] Could not serve index.html: ${err.message}`);
//       console.log(`  [ERROR] Make sure index.html is in the SAME folder as server.js`);
//       res.status(500).send(`Cannot find index.html. Make sure it is in: ${__dirname}`);
//     }
//   });
// });

// // ============================================================
// // PING
// // ============================================================
// app.get('/api/ping', (req, res) => {
//   console.log('  [PING] Connection test — responding OK');
//   res.json({ status: 'online', message: 'Server is reachable!', ip: localIP, port: PORT });
// });

// // ============================================================
// // INVENTORY ROUTES
// // ============================================================
// app.get('/api/inventory', (req, res) => {
//   console.log(`  [INVENTORY] GET — sending ${db.inventory.length} items`);
//   res.json(db.inventory);
// });

// app.post('/api/inventory', (req, res) => {
//   console.log(`  [INVENTORY] POST — body received:`, req.body);
//   const { barcode, name } = req.body;

//   if (!barcode || !name) {
//     console.log('  [INVENTORY] ERROR — missing barcode or name in request body');
//     return res.status(400).json({ error: 'barcode and name are required' });
//   }

//   const existing = db.inventory.find(i => i.barcode === barcode);
//   if (existing) {
//     existing.name = name;
//     existing.updatedAt = new Date().toISOString();
//     console.log(`  [INVENTORY] Updated existing item: "${name}" (${barcode})`);
//     printDB();
//     return res.json({ action: 'updated', item: existing });
//   }

//   const item = { id: `inv_${Date.now()}`, barcode, name, createdAt: new Date().toISOString() };
//   db.inventory.unshift(item);
//   console.log(`  [INVENTORY] Added new item: "${name}" (${barcode})`);
//   printDB();
//   res.status(201).json({ action: 'created', item });
// });

// app.delete('/api/inventory/:id', (req, res) => {
//   console.log(`  [INVENTORY] DELETE id: ${req.params.id}`);
//   const before = db.inventory.length;
//   db.inventory = db.inventory.filter(i => i.id !== req.params.id);
//   if (db.inventory.length === before) {
//     console.log('  [INVENTORY] DELETE — item not found');
//     return res.status(404).json({ error: 'Item not found' });
//   }
//   console.log('  [INVENTORY] DELETE — success');
//   printDB();
//   res.json({ status: 'deleted' });
// });

// // ============================================================
// // PURCHASE ROUTES
// // ============================================================
// app.get('/api/purchases', (req, res) => {
//   console.log(`  [PURCHASES] GET — sending ${db.purchases.length} entries`);
//   res.json(db.purchases);
// });

// app.post('/api/purchases', (req, res) => {
//   console.log(`  [PURCHASES] POST — body received:`, req.body);
//   const { barcode, name } = req.body;

//   if (!barcode || !name) {
//     console.log('  [PURCHASES] ERROR — missing barcode or name');
//     return res.status(400).json({ error: 'barcode and name are required' });
//   }

//   const entry = { id: `pur_${Date.now()}`, barcode, name, loggedAt: new Date().toISOString() };
//   db.purchases.unshift(entry);

//   if (!db.inventory.find(i => i.barcode === barcode)) {
//     db.inventory.unshift({ id: `inv_${Date.now()}`, barcode, name, createdAt: new Date().toISOString() });
//     console.log(`  [PURCHASES] Auto-added to inventory: "${name}"`);
//   }

//   console.log(`  [PURCHASES] Logged: "${name}" (${barcode})`);
//   printDB();
//   res.status(201).json({ action: 'logged', entry });
// });

// app.delete('/api/purchases/:id', (req, res) => {
//   console.log(`  [PURCHASES] DELETE id: ${req.params.id}`);
//   const before = db.purchases.length;
//   db.purchases = db.purchases.filter(i => i.id !== req.params.id);
//   if (db.purchases.length === before) {
//     console.log('  [PURCHASES] DELETE — not found');
//     return res.status(404).json({ error: 'Entry not found' });
//   }
//   console.log('  [PURCHASES] DELETE — success');
//   printDB();
//   res.json({ status: 'deleted' });
// });

// // ============================================================
// // SCAN LOG ROUTES
// // ============================================================
// app.get('/api/scans', (req, res) => {
//   console.log(`  [SCANS] GET — sending ${db.scans.length} scan events`);
//   res.json(db.scans);
// });

// app.post('/api/scans', (req, res) => {
//   console.log(`  [SCANS] POST — body received:`, req.body);
//   const { barcode } = req.body;

//   if (!barcode) {
//     console.log('  [SCANS] ERROR — missing barcode');
//     return res.status(400).json({ error: 'barcode required' });
//   }

//   const scan = { id: `scan_${Date.now()}`, barcode, scannedAt: new Date().toISOString() };
//   db.scans.unshift(scan);
//   console.log(`  [SCANS] Recorded scan: ${barcode}`);
//   res.status(201).json(scan);
// });

// // ============================================================
// // FULL DB SNAPSHOT
// // ============================================================
// app.get('/api/db', (req, res) => {
//   console.log('  [DB] Full snapshot requested');
//   res.json(db);
// });

// app.delete('/api/db', (req, res) => {
//   console.log('  [DB] CLEAR — wiping all data');
//   db = { inventory: [], purchases: [], scans: [] };
//   res.json({ status: 'cleared' });
// });

// // ============================================================
// // 404 HANDLER — tells you exactly what URL was wrong
// // ============================================================
// app.use((req, res) => {
//   console.log(`  [404] Route not found: ${req.method} ${req.url}`);
//   console.log('  [404] Available routes: GET /, GET /api/ping, GET|POST|DELETE /api/inventory, GET|POST|DELETE /api/purchases, GET|POST /api/scans, GET|DELETE /api/db');
//   res.status(404).json({ error: `Route "${req.url}" not found` });
// });

// // ============================================================
// // ERROR HANDLER
// // ============================================================
// app.use((err, req, res, next) => {
//   console.log(`  [SERVER ERROR] ${err.message}`);
//   console.log(`  [SERVER ERROR] Stack: ${err.stack}`);
//   res.status(500).json({ error: err.message });
// });

// // ============================================================
// // START SERVER
// // ============================================================
// app.listen(PORT, HOST, () => {
//   console.log('\n' + '='.repeat(55));
//   console.log('  SERVER LIVE');
//   console.log(`  Local:   http://localhost:${PORT}`);
//   console.log(`  Network: http://${localIP}:${PORT}  <- type this on your phone`);
//   console.log('='.repeat(55));
//   console.log('\n  How it works:');
//   console.log('  1. Phone connects to same Wi-Fi/hotspot as this PC');
//   console.log('  2. Phone opens browser, types the Network URL above');
//   console.log('  3. Server sends index.html directly to the phone');
//   console.log('  4. Phone interacts with all /api routes from there');
//   console.log('  5. No GitHub Pages needed — server IS the host\n');
// });

// // ============================================================
// // DB STATE PRINTER
// // ============================================================
// function printDB() {
//   console.log('\n  --- CURRENT DB STATE ---');
//   console.log(`  Inventory: ${db.inventory.length} items`);
//   db.inventory.forEach(i => console.log(`    - ${i.name} (${i.barcode})`));
//   console.log(`  Purchases: ${db.purchases.length} entries`);
//   db.purchases.forEach(p => console.log(`    - ${p.name} @ ${p.loggedAt}`));
//   console.log(`  Scans:     ${db.scans.length} events`);
//   console.log('  ------------------------\n');
// }






//////https code



const express = require('express');
const https = require('https');
const fs = require('fs');
const os = require('os');
const path = require('path');
const app = express();

const PORT = 3000;
const HOST = '0.0.0.0';

// ============================================================
// IN-MEMORY DATABASE
// ============================================================
let db = {
  inventory: [],
  purchases: [],
  scans: []
};

// ============================================================
// IP DETECTION — skips Tailscale, picks real Wi-Fi first
// ============================================================
function getLocalIP() {
  const ifaces = os.networkInterfaces();
  console.log('\n[STARTUP] Scanning network interfaces...');
  for (const name in ifaces) {
    for (const net of ifaces[name]) {
      console.log(`  Interface: ${name} | ${net.address} | Internal: ${net.internal} | ${net.family}`);
    }
  }

  // Priority 1: real Wi-Fi 192.168.x.x
  for (const name in ifaces) {
    for (const net of ifaces[name]) {
      if (net.family === 'IPv4' && !net.internal && net.address.startsWith('192.168.') && !net.address.startsWith('192.168.137.')) {
        console.log(`  [SELECTED] Wi-Fi IP: ${net.address} (${name})`);
        return net.address;
      }
    }
  }
  // Priority 2: PC hotspot
  for (const name in ifaces) {
    for (const net of ifaces[name]) {
      if (net.family === 'IPv4' && !net.internal && net.address.startsWith('192.168.137.')) {
        console.log(`  [SELECTED] Hotspot IP: ${net.address} (${name})`);
        return net.address;
      }
    }
  }
  // Priority 3: 10.x.x.x
  for (const name in ifaces) {
    for (const net of ifaces[name]) {
      if (net.family === 'IPv4' && !net.internal && net.address.startsWith('10.')) {
        console.log(`  [SELECTED] 10.x IP: ${net.address} (${name})`);
        return net.address;
      }
    }
  }
  // Last resort: skip Tailscale explicitly
  for (const name in ifaces) {
    if (/tailscale/i.test(name)) continue;
    for (const net of ifaces[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        console.log(`  [SELECTED] Fallback IP: ${net.address} (${name})`);
        return net.address;
      }
    }
  }
  return 'localhost';
}

const localIP = getLocalIP();

// ============================================================
// GLOBAL REQUEST LOGGER
// ============================================================
app.use((req, res, next) => {
  const t = new Date().toLocaleTimeString();
  console.log(`\n${'='.repeat(55)}`);
  console.log(`[${t}] ${req.method} ${req.url}`);
  console.log(`  From:         ${req.ip || req.socket.remoteAddress}`);
  console.log(`  Content-Type: ${req.headers['content-type'] || 'none'}`);
  if (req.body && Object.keys(req.body).length > 0) {
    console.log(`  Body:         ${JSON.stringify(req.body)}`);
  }
  next();
});

// ============================================================
// MIDDLEWARE
// ============================================================
app.use(express.json());
app.use(express.text());

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') {
    console.log('  [CORS] Preflight approved');
    return res.sendStatus(200);
  }
  next();
});

// ============================================================
// SERVE FRONTEND
// ============================================================
app.get('/', (req, res) => {
  const filePath = path.join(__dirname, 'frontend', 'index.html');
  console.log(`  [FRONTEND] Serving: ${filePath}`);
  res.sendFile(filePath, (err) => {
    if (err) {
      console.log(`  [ERROR] index.html not found at: ${filePath}`);
      console.log(`  [ERROR] Your project structure must have frontend/index.html`);
      res.status(500).send(`Cannot find frontend/index.html. Looking in: ${__dirname}`);
    }
  });
});

// Suppress favicon 404 noise
app.get('/favicon.ico', (req, res) => res.sendStatus(204));

// ============================================================
// PING — connection + HTTPS test
// ============================================================
app.get('/api/ping', (req, res) => {
  console.log('  [PING] Success — connection confirmed over HTTPS');
  res.json({
    status: 'online',
    message: 'HTTPS connection confirmed! Camera access now available.',
    ip: localIP,
    port: PORT,
    protocol: 'https'
  });
});

// ============================================================
// INVENTORY
// ============================================================
app.get('/api/inventory', (req, res) => {
  console.log(`  [INVENTORY] GET — ${db.inventory.length} items`);
  res.json(db.inventory);
});

app.post('/api/inventory', (req, res) => {
  console.log(`  [INVENTORY] POST — body:`, req.body);
  const { barcode, name } = req.body;
  if (!barcode || !name) {
    console.log('  [INVENTORY] ERROR — missing barcode or name');
    return res.status(400).json({ error: 'barcode and name are required' });
  }
  const existing = db.inventory.find(i => i.barcode === barcode);
  if (existing) {
    existing.name = name;
    existing.updatedAt = new Date().toISOString();
    console.log(`  [INVENTORY] Updated: "${name}" (${barcode})`);
    printDB();
    return res.json({ action: 'updated', item: existing });
  }
  const item = { id: `inv_${Date.now()}`, barcode, name, createdAt: new Date().toISOString() };
  db.inventory.unshift(item);
  console.log(`  [INVENTORY] Added: "${name}" (${barcode})`);
  printDB();
  res.status(201).json({ action: 'created', item });
});

app.delete('/api/inventory/:id', (req, res) => {
  console.log(`  [INVENTORY] DELETE id: ${req.params.id}`);
  const before = db.inventory.length;
  db.inventory = db.inventory.filter(i => i.id !== req.params.id);
  if (db.inventory.length === before) return res.status(404).json({ error: 'Not found' });
  printDB();
  res.json({ status: 'deleted' });
});

// ============================================================
// PURCHASES
// ============================================================
app.get('/api/purchases', (req, res) => {
  console.log(`  [PURCHASES] GET — ${db.purchases.length} entries`);
  res.json(db.purchases);
});

app.post('/api/purchases', (req, res) => {
  console.log(`  [PURCHASES] POST — body:`, req.body);
  const { barcode, name } = req.body;
  if (!barcode || !name) {
    console.log('  [PURCHASES] ERROR — missing barcode or name');
    return res.status(400).json({ error: 'barcode and name are required' });
  }
  const entry = { id: `pur_${Date.now()}`, barcode, name, loggedAt: new Date().toISOString() };
  db.purchases.unshift(entry);
  if (!db.inventory.find(i => i.barcode === barcode)) {
    db.inventory.unshift({ id: `inv_${Date.now()}`, barcode, name, createdAt: new Date().toISOString() });
    console.log(`  [PURCHASES] Auto-added to inventory: "${name}"`);
  }
  console.log(`  [PURCHASES] Logged: "${name}" (${barcode})`);
  printDB();
  res.status(201).json({ action: 'logged', entry });
});

app.delete('/api/purchases/:id', (req, res) => {
  console.log(`  [PURCHASES] DELETE id: ${req.params.id}`);
  const before = db.purchases.length;
  db.purchases = db.purchases.filter(i => i.id !== req.params.id);
  if (db.purchases.length === before) return res.status(404).json({ error: 'Not found' });
  printDB();
  res.json({ status: 'deleted' });
});

// ============================================================
// SCANS
// ============================================================
app.get('/api/scans', (req, res) => {
  console.log(`  [SCANS] GET — ${db.scans.length} events`);
  res.json(db.scans);
});

app.post('/api/scans', (req, res) => {
  console.log(`  [SCANS] POST — body:`, req.body);
  const { barcode } = req.body;
  if (!barcode) return res.status(400).json({ error: 'barcode required' });
  const scan = { id: `scan_${Date.now()}`, barcode, scannedAt: new Date().toISOString() };
  db.scans.unshift(scan);
  console.log(`  [SCANS] Recorded: ${barcode}`);
  res.status(201).json(scan);
});

// ============================================================
// FULL DB
// ============================================================
app.get('/api/db', (req, res) => {
  console.log('  [DB] Snapshot requested');
  res.json(db);
});

app.delete('/api/db', (req, res) => {
  console.log('  [DB] Clearing all data');
  db = { inventory: [], purchases: [], scans: [] };
  res.json({ status: 'cleared' });
});

// ============================================================
// 404 + ERROR
// ============================================================
app.use((req, res) => {
  console.log(`  [404] ${req.method} ${req.url}`);
  res.status(404).json({ error: `Route "${req.url}" not found` });
});

app.use((err, req, res, next) => {
  console.log(`  [500] ${err.message}`);
  res.status(500).json({ error: err.message });
});

// ============================================================
// START — HTTPS using self-signed cert
// ============================================================
const certPath = path.join(__dirname, 'certs', 'cert.pem');
const keyPath  = path.join(__dirname, 'certs', 'key.pem');

if (!fs.existsSync(certPath) || !fs.existsSync(keyPath)) {
  console.log('\n[ERROR] SSL certificates not found!');
  console.log('  Expected:');
  console.log(`    ${certPath}`);
  console.log(`    ${keyPath}`);
  console.log('\n  Run this command in your project folder to generate them:');
  console.log('  openssl req -x509 -newkey rsa:2048 -keyout certs/key.pem -out certs/cert.pem -days 365 -nodes -subj "/CN=192.168.1.121"');
  console.log('\n  Then restart: node localserver.js\n');
  process.exit(1);
}

const sslOptions = {
  key:  fs.readFileSync(keyPath),
  cert: fs.readFileSync(certPath)
};

https.createServer(sslOptions, app).listen(PORT, HOST, () => {
  console.log('\n' + '='.repeat(55));
  console.log('  SERVER LIVE (HTTPS — camera access enabled)');
  console.log(`  Local:   https://localhost:${PORT}`);
  console.log(`  Network: https://${localIP}:${PORT}  <- type this on your phone`);
  console.log('='.repeat(55));
  console.log('\n  IMPORTANT — first time on phone:');
  console.log('  Your browser will show a security warning.');
  console.log('  Tap "Advanced" then "Proceed to site" to continue.');
  console.log('  This is normal for self-signed certs on local networks.\n');
});

function printDB() {
  console.log('\n  --- DB STATE ---');
  console.log(`  Inventory: ${db.inventory.length} | Purchases: ${db.purchases.length} | Scans: ${db.scans.length}`);
  db.inventory.slice(0, 3).forEach(i => console.log(`    INV: ${i.name} (${i.barcode})`));
  db.purchases.slice(0, 3).forEach(p => console.log(`    PUR: ${p.name}`));
  console.log('  ----------------\n');
}