/ server.js - Node.js Express API Server
const express = require('express');
const cors = require('cors');
const { Low, JSONFile } = require('lowdb');
const path = require('path');

const app = express();
const port = 3000;

// --- LowDB Setup ---

// 1. Items Database (db.json)
const dbFile = path.join(__dirname, 'db.json');
const adapterItems = new JSONFile(dbFile);
const dbItems = new Low(adapterItems);

// 2. Users Database (users.json)
const usersFile = path.join(__dirname, 'users.json');
const adapterUsers = new JSONFile(usersFile);
const dbUsers = new Low(adapterUsers);

// Function to read and initialize the database
async function initializeDatabases() {
    await dbItems.read();
    dbItems.data = dbItems.data || { items: [] };
    await dbUsers.read();
    dbUsers.data = dbUsers.data || { users: [] };
   
    console.log(`Database loaded: ${dbFile} (items) and ${usersFile} (users)`);
}

// Ensure databases are initialized before starting the server
initializeDatabases().then(() => {
   
    // --- Middleware ---
    app.use(cors()); // Enable CORS for the frontend (index.html)
    app.use(express.json()); // Enable parsing JSON request bodies
   
    // --- Helper function for generating unique IDs ---
    const generateId = (collection) => {
        const maxId = collection.length > 0
            ? Math.max(...collection.map(n => n.id))
            : 0;
        return maxId + 1;
    };

    // --- Item Routes (/api/items) ---
    const itemRouter = express.Router();

    // GET all items
    itemRouter.get('/', (req, res) => {
        res.json(dbItems.data.items);
    });

    // POST (Create) new item
    itemRouter.post('/', async (req, res) => {
        const item = req.body;
        if (!item.name || typeof item.value === 'undefined') {
            return res.status(400).json({ error: 'Item must have a name and a value.' });
        }
        item.id = generateId(dbItems.data.items);
        dbItems.data.items.push(item);
        await dbItems.write();
        res.status(201).json(item);
    });

    // PUT (Update) existing item
    itemRouter.put('/:id', async (req, res) => {
        const id = Number(req.params.id);
        const itemIndex = dbItems.data.items.findIndex(item => item.id === id);

        if (itemIndex === -1) {
            return res.status(404).json({ error: 'Item not found.' });
        }
       
        const updatedItem = { ...dbItems.data.items[itemIndex], ...req.body, id: id };
       
        // Basic validation
        if (!updatedItem.name || typeof updatedItem.value === 'undefined') {
            return res.status(400).json({ error: 'Item must have a name and a value.' });
        }

        dbItems.data.items[itemIndex] = updatedItem;
        await dbItems.write();
        res.json(updatedItem);
    });

    // DELETE item
    itemRouter.delete('/:id', async (req, res) => {
        const id = Number(req.params.id);
        const initialLength = dbItems.data.items.length;
        dbItems.data.items = dbItems.data.items.filter(item => item.id !== id);

        if (dbItems.data.items.length === initialLength) {
            return res.status(404).json({ error: 'Item not found for deletion.' });
        }
        await dbItems.write();
        res.status(204).end(); // 204 No Content for successful deletion
    });
   
    // --- User Routes (/api/users) ---
    const userRouter = express.Router();

    // GET all users
    userRouter.get('/', (req, res) => {
        res.json(dbUsers.data.users);
    });

    // POST (Create) new user
    userRouter.post('/', async (req, res) => {
        const user = req.body;
        if (!user.username || !user.email) {
            return res.status(400).json({ error: 'User must have a username and email.' });
        }
        user.id = generateId(dbUsers.data.users);
        dbUsers.data.users.push(user);
        await dbUsers.write();
        res.status(201).json(user);
    });

    // PUT (Update) existing user
    userRouter.put('/:id', async (req, res) => {
        const id = Number(req.params.id);
        const userIndex = dbUsers.data.users.findIndex(user => user.id === id);

        if (userIndex === -1) {
            return res.status(404).json({ error: 'User not found.' });
        }
       
        const updatedUser = { ...dbUsers.data.users[userIndex], ...req.body, id: id };
       
        // Basic validation
        if (!updatedUser.username || !updatedUser.email) {
            return res.status(400).json({ error: 'User must have a username and email.' });
        }

        dbUsers.data.users[userIndex] = updatedUser;
        await dbUsers.write();
        res.json(updatedUser);
    });

    // DELETE user
    userRouter.delete('/:id', async (req, res) => {
        const id = Number(req.params.id);
        const initialLength = dbUsers.data.users.length;
        dbUsers.data.users = dbUsers.data.users.filter(user => user.id !== id);

        if (dbUsers.data.users.length === initialLength) {
            return res.status(404).json({ error: 'User not found for deletion.' });
        }
        await dbUsers.write();
        res.status(204).end(); // 204 No Content for successful deletion
    });

    // --- Route Linking ---
    app.use('/api/items', itemRouter);
    app.use('/api/users', userRouter);

    // --- Start Server ---
    app.listen(port, () => {
        console.log(`Server listening at http://localhost:${port}`);
        console.log(`Item routes available at http://localhost:${port}/api/items`);
        console.log(`User routes available at http://localhost:${port}/api/users`);
    });
});