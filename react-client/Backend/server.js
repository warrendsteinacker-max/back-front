import { JSONFilePreset } from 'lowdb/node';
import express from 'express';
import itemRouter from './itemRoutes.js';
import userRouter from './userRoutes.js';

const app = express();
const PORT = 8082;

// 1. Initialize TWO separate databases (will create files if they don't exist)
// itemDb persists to 'db.json'
const itemDb = await JSONFilePreset('db.json', { items: [] });
// userDb persists to 'users.json'
const userDb = await JSONFilePreset('users.json', { users: [] });

// Standard Express Middleware
app.use(express.json());

// 2. Custom Middleware to attach both DBs to the request object (req)
// This lets controllers access the correct database
app.use((req, res, next) => {
    req.itemDb = itemDb;
    req.userDb = userDb;
    next();
});

// 3. Use modular routers
app.use('/api/items', itemRouter);
app.use('/api/users', userRouter);

app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}.`);
    console.log(`Item API: http://localhost:${PORT}/api/items`);
    console.log(`User API: http://localhost:${PORT}/api/users`);
});