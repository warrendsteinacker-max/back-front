// App.jsx
import React, { useState, useEffect, useCallback } from 'react';
import ItemForm from './ItemForm';

const API_URL = 'http://localhost:8000/api/items';

export default function App() {
    const [items, setItems] = useState([]);
    const [isLoadingList, setIsLoadingList] = useState(true);
    const [error, setError] = useState(null);

    // Function to fetch data from the lowdb backend
    const fetchItems = useCallback(async () => {
        setIsLoadingList(true);
        setError(null);
        try {
            const response = await fetch(API_URL);
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const data = await response.json();
            setItems(data);
        } catch (err) {
            setError('Could not fetch items. Is the Node.js server running?');
            console.error(err);
        } finally {
            setIsLoadingList(false);
        }
    }, []);

    // Load items on initial mount
    useEffect(() => {
        fetchItems();
    }, [fetchItems]);

    return (
        <div style={{ fontFamily: 'Arial, sans-serif', padding: '20px' }}>
            <h1>React 19 Frontend with lowdb Backend</h1>
            
            <ItemForm onItemAdded={fetchItems} /> {/* Passes the refresh function */}

            <hr />

            <h2>📦 Current Items (from lowdb)</h2>
            {isLoadingList && <p>Loading item list...</p>}
            {error && <p style={{ color: 'red' }}>**Error:** {error}</p>}
            
            {!isLoadingList && items.length === 0 && !error && (
                <p>No items found. Add one above!</p>
            )}

            {!isLoadingList && items.length > 0 && (
                <ul>
                    {items.map((item, index) => (
                        <li key={index}>
                            **ID:** {item.id} - **Name:** {item.name}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}