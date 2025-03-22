import axios from 'axios';
// ...existing code...

const fetchLocations = async () => {
    try {
        const response = await axios.get('http://localhost:8000/parking/locations/', {
            headers: {
                'Authorization': `Bearer ${yourAuthToken}` // Replace `yourAuthToken` with the actual token
            }
        });
        // ...existing code...
    } catch (error) {
        console.error('Error fetching locations:', error);
    }
};

// ...existing code...
