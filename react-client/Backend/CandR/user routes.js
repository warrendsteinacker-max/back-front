// userRoutes.js
import express from 'express';
import {
    createUser,
    getAllUsers,
    getUserById,
    updateUser,
    deleteUser
} from './userController.js';

const router = express.Router();

// Base route: /api/users
router.post('/', createUser);        // POST /api/users
router.get('/', getAllUsers);         // GET /api/users
router.get('/:id', getUserById);     // GET /api/users/:id
router.put('/:id', updateUser);      // PUT /api/users/:id
router.delete('/:id', deleteUser);  // DELETE /api/users/:id

export default router;
