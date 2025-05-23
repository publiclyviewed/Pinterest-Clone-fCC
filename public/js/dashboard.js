document.addEventListener('DOMContentLoaded', () => {
    // Get DOM elements
    const welcomeMessageElement = document.getElementById('welcome-message');
    const addImageForm = document.getElementById('add-image-form');
    const imageUrlInput = document.getElementById('image-url');
    const imageDescriptionInput = document.getElementById('image-description');
    const myImagesWall = document.getElementById('my-images-wall');

    // Variable to hold the Masonry instance
    let masonryInstance = null;

    // --- Placeholder Image URL ---
    // Use a placeholder service or a local image URL
    const BROKEN_IMAGE_PLACEHOLDER = 'https://via.placeholder.com/200x150.png?text=Broken+Image';
    // -----------------------------

    // --- Masonry Initialization ---

    // Function to initialize or re-layout Masonry
    function initializeMasonry() {
         // Check if Masonry is loaded
         if (typeof Masonry === 'undefined') {
             console.error("Masonry library not loaded.");
             return;
         }

         // Destroy existing Masonry instance if it exists
         if (masonryInstance) {
             masonryInstance.destroy();
             masonryInstance = null; // Clear the instance
         }

         // Only initialize if there are items to lay out
         const gridItems = myImagesWall.querySelectorAll('.grid-item');
         if (gridItems.length > 0) {
             // Initialize Masonry on the container
             masonryInstance = new Masonry( myImagesWall, {
               // options
               itemSelector: '.grid-item', // Selector for grid items
               columnWidth: 200, // Column width in pixels (adjust as needed, match CSS)
               gutter: 10, // Space between items
               // percentPosition: true, // Use percentages for column widths (requires CSS)
               // fitWidth: true // Container width is adjusted to fit columns
             });

             // Optional: Listen for layout complete
              masonryInstance.on('layoutComplete', function() {
                console.log('Dashboard Masonry layout complete');
              });

             // Initial layout (Masonry pkgd often handles image loading before initial layout)
             // If layout is off on load, you might need an explicit imagesLoaded call here
             // For simplicity, let's just call layout. Masonry pkgd often waits.
             masonryInstance.layout();
         } else {
             console.log('No dashboard grid items to initialize Masonry.');
         }
    }

    // --- Fetching Data ---

    // Function to fetch user info and display welcome message
    async function fetchUserInfo() {
         try {
             const response = await fetch('/profile'); // Use the existing /profile route
             if (!response.ok) {
                 if (response.status === 401) {
                      console.error('Not authenticated. Redirecting to login.');
                      window.location.href = '/auth/github';
                      return; // Stop execution
                 }
                 throw new Error(`HTTP error! status: ${response.status}`);
             }
             const userData = await response.json();
             if (userData.isAuthenticated && welcomeMessageElement) {
                  welcomeMessageElement.textContent = `Welcome to your dashboard, ${userData.user.username}!`;
             }
         } catch (error) {
             console.error('Error fetching user info:', error);
         }
    }


    // Function to create a single grid item element for an image
    function createGridItemElement(image) {
         const gridItem = document.createElement('div');
         gridItem.className = 'grid-item'; // Add class for itemSelector
         gridItem.dataset.imageId = image._id; // Store image ID for deletion

         const imgElement = document.createElement('img');
         imgElement.src = image.url;
         if (image.description) {
             imgElement.alt = image.description;
             imgElement.title = image.description; // Tooltip
         }
         imgElement.style.display = 'block'; // Prevents extra space below image
         // imgElement.style.maxWidth = '100%'; // Handled by CSS


         // --- Add Error Handling for Broken Images ---
         // Use jQuery to select the image element and attach the error handler
         $(imgElement).on('error', function() {
             console.error('Image failed to load:', this.src);
             // Replace the source with the placeholder image
             this.src = BROKEN_IMAGE_PLACEHOLDER;
             // Optional: Add a class for styling broken images if needed
             $(this).addClass('broken-image');

             // Important: Tell Masonry to relayout the item, as the size might change
             // Find the grid item container (using $(this).closest for robustness)
             const parentGridItem = $(this).closest('.grid-item')[0]; // Get the raw DOM element
             if (masonryInstance && parentGridItem) {
                 // Simple relayout is often sufficient if only the size changes.
                 masonryInstance.layout();
                 // If layout seems off, try:
                 // masonryInstance.reloadItems();
                 // masonryInstance.layout();
             }
         });
         // ---------------------------------------------


         gridItem.appendChild(imgElement);

         // Add description below the image (optional)
         if (image.description) {
              const descElement = document.createElement('p');
              descElement.textContent = image.description;
              // Styles handled by CSS .grid-item p
              gridItem.appendChild(descElement);
         }

         // Add delete button
         const deleteButton = document.createElement('button');
         deleteButton.textContent = 'Delete';
         deleteButton.className = 'delete-button'; // Add class for styling/selection
         // Styles handled by CSS .delete-button
         deleteButton.dataset.imageId = image._id; // Add image ID to button too (optional, but convenient for event delegation)
         gridItem.appendChild(deleteButton);

         return gridItem;
    }


    // Function to fetch and display user's images
    async function fetchAndDisplayImages() {
        try {
            const response = await fetch('/api/my-images'); // Make request to the backend API
            if (!response.ok) {
                if (response.status === 401) {
                     console.error('Not authenticated. Redirecting to login.');
                     window.location.href = '/auth/github'; // Redirect if unauthorized
                     return; // Stop execution
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const images = await response.json(); // Get the array of images

            // Clear current images
            myImagesWall.innerHTML = ''; // Clear the container

            if (images.length === 0) {
                myImagesWall.innerHTML = '<p>You haven\'t linked any images yet.</p>';
                // Destroy Masonry if no items after fetch
                 if (masonryInstance) {
                     masonryInstance.destroy();
                     masonryInstance = null;
                 }
                return; // Stop execution
            }

            // Create and append grid items for all fetched images
            images.forEach(image => {
                 const gridItem = createGridItemElement(image);
                 myImagesWall.appendChild(gridItem); // Add the grid item to the wall
            });

            // Initialize or reload Masonry after adding all items
            // Masonry pkgd version waits for images to load before initial layout
            initializeMasonry();

        } catch (error) {
            console.error('Error fetching images:', error);
            myImagesWall.innerHTML = '<p>Error loading images.</p>';
             // Destroy Masonry if there's an error fetching
            if (masonryInstance) {
                masonryInstance.destroy();
                masonryInstance = null;
            }
        }
    }


    // --- Event Handlers ---

    // Handle form submission for adding new image
    addImageForm.addEventListener('submit', async (event) => {
        event.preventDefault(); // Prevent default form submission

        const url = imageUrlInput.value.trim();
        const description = imageDescriptionInput.value.trim();

        if (!url) {
            alert('Image URL is required.');
            return;
        }

        // Optional: Basic URL validation regex (can be more robust)
        const urlPattern = /^(https?:\/\/.*\.(?:png|jpg|jpeg|gif|svg|webp))$/i;
         if (!urlPattern.test(url)) {
             alert('Please enter a valid image URL (png, jpg, gif, svg, webp) starting with http or https.');
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
                     return; // Stop execution
                }
                 // Try to parse error message from backend if available
                const errorData = await response.json().catch(() => ({ message: 'Failed to add image.' }));
                throw new Error(`HTTP error! status: ${response.status}, message: ${errorData.message}`);
            }

            const newImage = await response.json(); // Get the saved image data back
            console.log('Image added successfully:', newImage);

            // Clear the form
            imageUrlInput.value = '';
            imageDescriptionInput.value = '';

            // Create a new grid item for the newly added image
            const gridItem = createGridItemElement(newImage);

            // Append the new item to the container
            myImagesWall.appendChild(gridItem);

            // Tell Masonry to add and layout the new item
            // Use imagesLoaded implicitly via Masonry pkgd, or explicitly wait for image load
            // Explicitly waiting for the image load is more robust if the image size affects layout significantly
             const img = gridItem.querySelector('img');

            // Check if image is already loaded or wait for load/error
            if (img.complete) {
                 console.log('Image already loaded, appending with Masonry.');
                 if (masonryInstance) masonryInstance.appended(gridItem);
                 else initializeMasonry(); // Initialize if this is the first item
            } else {
                 // Wait for image to load
                 img.addEventListener('load', function() {
                     console.log('Image loaded, appending with Masonry.');
                     if (masonryInstance) masonryInstance.appended(gridItem);
                     else initializeMasonry(); // Initialize if this is the first item
                 });
                 // Error handling for image load (this is already handled by the $(imgElement).on('error', ...) above)
                 // We don't need to explicitly remove here again usually.
                 // img.addEventListener('error', function() { ... });
             }


            // Re-initialize Masonry if this was the first item added
             const currentGridItems = myImagesWall.querySelectorAll('.grid-item');
             if (currentGridItems.length === 1 && !masonryInstance) { // Check after the new item is added but before append/load logic
                 // This case is handled inside the load/complete check now
             }


        } catch (error) {
            console.error('Error adding image:', error);
            alert('Failed to add image. ' + error.message);
        }
    });


    // --- Event Delegation for Delete Buttons ---
    // Use event delegation on the container since items are added/removed dynamically
    myImagesWall.addEventListener('click', async (event) => {
        // Check if the clicked element is a delete button or inside one
        const deleteButton = event.target.closest('.delete-button');

        if (deleteButton) {
            // Find the parent grid item to get the image ID
            const gridItem = deleteButton.closest('.grid-item');
            if (!gridItem) {
                console.error('Could not find parent grid item for delete button.');
                return;
            }

            const imageId = gridItem.dataset.imageId; // Get the image ID from data attribute

            if (!imageId) {
                 console.error('Image ID not found on grid item.');
                 return;
            }

            // Optional: Confirmation dialog
            if (!confirm('Are you sure you want to delete this image?')) {
                console.log('Delete cancelled by user.');
                return; // User cancelled deletion
            }

            console.log('Attempting to delete image with ID:', imageId);

            try {
                // Send DELETE request to the backend API
                const response = await fetch(`/api/images/${imageId}`, {
                    method: 'DELETE'
                });

                if (!response.ok) {
                     if (response.status === 401) {
                         console.error('Not authenticated. Redirecting to login.');
                         window.location.href = '/auth/github';
                         return; // Stop execution
                    }
                     // Try to parse error message from backend if available
                    const errorData = await response.json().catch(() => ({ message: 'Failed to delete image.' }));
                    throw new Error(`HTTP error! status: ${response.status}, message: ${errorData.message}`);
                }

                // If successful, remove the image item from the DOM and relayout Masonry
                console.log('Image deleted from backend, removing from DOM.');

                // Masonry needs the actual DOM element to remove
                 if (masonryInstance) {
                    masonryInstance.remove(gridItem); // Remove using Masonry
                    masonryInstance.layout(); // Trigger layout update
                 } else {
                     // If Masonry wasn't initialized for some reason, just remove it from DOM
                     gridItem.remove();
                 }

                // Optional: Display success message
                // alert('Image deleted successfully!'); // Or show a less intrusive notification

            } catch (error) {
                console.error('Error deleting image:', error);
                alert('Failed to delete image. ' + error.message); // Show an alert on error
            }
        }
    });
    // ---------------------------------------------------------


    // --- Initial Load ---
    // Fetch user info and images when the dashboard page loads
    fetchUserInfo();
    fetchAndDisplayImages();


}); // End of DOMContentLoaded listener