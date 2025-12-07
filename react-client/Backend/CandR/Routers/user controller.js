// userController.js
// Handles logic for the 'users.json' database

// POST: Create a new user
export const createUser = async (req, res) => {
    const userDb = req.userDb;
    const newUser = { id: Date.now(), ...req.body };
    await userDb.update(({ users }) => users.push(newUser));
    res.status(201).json(newUser);
};

// GET: Get all users
export const getAllUsers = (req, res) => {
    const userDb = req.userDb;
    const users = userDb.data.users;
    res.json(users);
};

// GET: Get a single user by ID
export const getUserById = (req, res) => {
    const userDb = req.userDb;
    const userId = parseInt(req.params.id);
    const user = userDb.data.users.find(u => u.id === userId);

    if (user) {
        res.json(user);
    } else {
        res.status(404).send('User not found');
    }
};

// PUT: Update a user by ID
export const updateUser = async (req, res) => {
    const userDb = req.userDb;
    const userId = parseInt(req.params.id);
    const updatedData = req.body;

    await userDb.update(({ users }) => {
        const index = users.findIndex(u => u.id === userId);
        if (index !== -1) {
            users[index] = { ...users[index], ...updatedData };
        }
    });
    res.sendStatus(200);
};

// DELETE: Delete a user by ID
export const deleteUser = async (req, res) => {
    const userDb = req.userDb;
    const userId = parseInt(req.params.id);

    await userDb.update(({ users }) => {
        // Filter out the user with the matching ID
        return users.filter(u => u.id !== userId);
    });
    res.sendStatus(204);
};