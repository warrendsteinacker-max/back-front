// itemController.js
// Handles logic for the 'db.json' database

// POST: Create a new item
export const createItem = async (req, res) => {
    // Access the itemDb instance from the request object
    const itemDb = req.itemDb; 
    // Create a new item object with a timestamp ID and request body data
    const newItem = { id: Date.now(), ...req.body };
    // Use .update to atomically add the new item to the 'items' array
    await itemDb.update(({ items }) => items.push(newItem)); 
    res.status(201).json(newItem);
};

// GET: Get all items
export const getAllItems = (req, res) => {
    const itemDb = req.itemDb;
    // Read the current data from the 'items' collection
    const items = itemDb.data.items;
    res.json(items);
};

// GET: Get a single item by ID
export const getItemById = (req, res) => {
    const itemDb = req.itemDb;
    const itemId = parseInt(req.params.id);
    // Find the item by its ID
    const item = itemDb.data.items.find(i => i.id === itemId);

    if (item) {
        res.json(item);
    } else {
        res.status(404).send('Item not found');
    }
};

// PUT: Update an item by ID
export const updateItem = async (req, res) => {
    const itemDb = req.itemDb;
    const itemId = parseInt(req.params.id);
    const updatedData = req.body;

    await itemDb.update(({ items }) => {
        const index = items.findIndex(item => item.id === itemId);
        if (index !== -1) {
            // Merge the existing item with the updated data
            items[index] = { ...items[index], ...updatedData };
        }
    });

    res.sendStatus(200);
};

// DELETE: Delete an item by ID
export const deleteItem = async (req, res) => {
    const itemDb = req.itemDb;
    const itemId = parseInt(req.params.id);

    await itemDb.update(({ items }) => {
        // Return a new array filtered to exclude the item with the matching ID
        return items.filter(i => i.id !== itemId);
    });

    res.sendStatus(204);
};