// ItemForm.jsx
import React, { useState } from 'react';

const API_URL = 'http://localhost:8000/api/items';

export default function ItemForm({ onItemAdded }) {
    const [name, setName] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [status, setStatus] = useState(null); // 'success', 'error'

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!name.trim()) return;

        setIsLoading(true);
        setStatus(null); // Clear previous status

        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name }),
            });

            if (!response.ok) {
                throw new Error('Failed to create item');
            }

            // Success Visual Feedback
            setStatus('success');
            setName(''); // Clear form
            onItemAdded(); // Tell parent component to refresh the list

        } catch (error) {
            console.error('POST Error:', error);
            // Error Visual Feedback
            setStatus('error');
        } finally {
            setIsLoading(false);
            // Auto-clear success/error message after a short time
            setTimeout(() => setStatus(null), 3000);
        }
    };

    let feedbackMessage = null;
    if (isLoading) {
        // ⏳ Loading State (Visual Feedback)
        feedbackMessage = <p style={{ color: 'blue' }}>**⏳ Adding item...**</p>; 
    } else if (status === 'success') {
        // ✅ Success State (Visual Feedback)
        feedbackMessage = <p style={{ color: 'green' }}>**✅ Item Added Successfully!**</p>;
    } else if (status === 'error') {
        // ❌ Error State (Visual Feedback)
        feedbackMessage = <p style={{ color: 'red' }}>**❌ Failed to add item. Check server status.**</p>;
    }

    return (
        <div style={{ border: '1px solid #ccc', padding: '20px', marginBottom: '20px' }}>
            <h3>➕ Add New Item</h3>
            <form onSubmit={handleSubmit}>
                <input
                    type="text"
                    placeholder="Item Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={isLoading}
                />
                <button type="submit" disabled={isLoading}>
                    {isLoading ? 'Sending...' : 'Add Item'}
                </button>
            </form>
            {/* Display Visual Feedback */}
            {feedbackMessage} 
        </div>
    );
}