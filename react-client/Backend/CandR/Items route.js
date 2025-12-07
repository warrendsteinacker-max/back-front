// itemRoutes.js
import express from 'express';
import {
    createItem,
    getAllItems,
    getItemById,
    updateItem,
    deleteItem
} from './itemController.js';

const router = express.Router();

// Base route: /api/items
router.post('/', createItem);        // POST /api/items
router.get('/', getAllItems);         // GET /api/items
router.get('/:id', getItemById);     // GET /api/items/:id
router.put('/:id', updateItem);      // PUT /api/items/:id
router.delete('/:id', deleteItem);  // DELETE /api/items/:id

export default router;