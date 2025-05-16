document.addEventListener('DOMContentLoaded', () => {
    const addImageForm = document.getElementById('add-image-form');
    const imageUrlInput = document.getElementById('image-url');
    const imageDescriptionInput = document.getElementById('image-description');
    const myImagesWall = document.getElementById('my-images-wall'); // Element to display images

    // Function to fetch and display user's images
    async function fetchAndDisplayImages() {
        try {
            const response = await fetch('/api/my-images'); // Make request to the backend API
            if (!response.ok) {
                if (response.status === 401) {
                     console.error('Not authenticated. Redirecting to login.');
                     window.location.href = '/auth/github'; // Redirect if unauthorized
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const images = await response.json(); // Get the array of images

            // Clear current images
            myImagesWall.innerHTML = '';

            if (images.length === 0) {
                myImagesWall.innerHTML = '<p>You haven\'t linked any images yet.</p>';
                return;
            }

            // Display images (basic display for now, will use Masonry later)
            images.forEach(image => {
                const imgElement = document.createElement('img');
                imgElement.src = image.url;
                if (image.description) {
                    imgElement.alt = image.description;
                    imgElement.title = image.description; // Tooltip
                }
                imgElement.style.maxWidth = '200px'; // Basic styling
                imgElement.style.margin = '5px'; // Basic styling
                myImagesWall.appendChild(imgElement);
            });

            // TODO: Initialize Masonry.js here later

        } catch (error) {
            console.error('Error fetching images:', error);
            myImagesWall.innerHTML = '<p>Error loading images.</p>';
        }
    }

    // Fetch images when the dashboard page loads
    fetchAndDisplayImages();


    // Handle form submission for adding new image
    addImageForm.addEventListener('submit', async (event) => {
        event.preventDefault(); // Prevent default form submission

        const url = imageUrlInput.value.trim();
        const description = imageDescriptionInput.value.trim();

        if (!url) {
            alert('Image URL is required.');
            return;
        }

        try {
            const response = await fetch('/api/images', {
                method: 'POST', // Send as a POST request
                headers: {
                    'Content-Type': 'application/json' // Indicate JSON data
                },
                body: JSON.stringify({ url, description }) // Send data as JSON string
            });

            if (!response.ok) {
                 if (response.status === 401) {
                     console.error('Not authenticated. Redirecting to login.');
                     window.location.href = '/auth/github'; // Redirect if unauthorized
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const newImage = await response.json(); // Get the saved image data back
            console.log('Image added successfully:', newImage);

            // Clear the form
            imageUrlInput.value = '';
            imageDescriptionInput.value = '';

            // Re-fetch and display the updated list of images
            fetchAndDisplayImages();

        } catch (error) {
            console.error('Error adding image:', error);
            alert('Failed to add image.'); // Show an alert on error
        }
    });
});