document.addEventListener('DOMContentLoaded', () => {
    const publicImagesWall = document.getElementById('public-images-wall');

    // Variable to hold the Masonry instance for the public wall
    let publicMasonryInstance = null;

     // Function to create a single grid item element for an image (similar to dashboard)
    function createGridItemElement(image) {
         const gridItem = document.createElement('div');
         gridItem.className = 'grid-item'; // Use the same class as dashboard

         // Note: We don't add delete buttons or image ID dataset for public view

         const imgElement = document.createElement('img');
         imgElement.src = image.url;
         if (image.description) {
             imgElement.alt = image.description;
             imgElement.title = image.description; // Tooltip
         }
         imgElement.style.display = 'block'; // Prevents extra space below image

         gridItem.appendChild(imgElement);

         // Add description below the image (optional)
         if (image.description) {
              const descElement = document.createElement('p');
              descElement.textContent = image.description;
              gridItem.appendChild(descElement);
         }

         // Add owner's username below the description
         if (image.owner && image.owner.username) { // Check if owner is populated
             const ownerElement = document.createElement('p');
             ownerElement.textContent = `by ${image.owner.username}`;
             ownerElement.style.fontSize = '0.8em';
             ownerElement.style.color = '#888';
             ownerElement.style.marginTop = '4px';
             gridItem.appendChild(ownerElement);
         }


         return gridItem;
    }


    // Function to fetch and display public images
    async function fetchAndDisplayPublicImages() {
        try {
            // Fetch images from the new public API route
            const response = await fetch('/api/images'); // Or '/api/users/:userId/images' if Browse specific user

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const images = await response.json();

            // Clear current images
            publicImagesWall.innerHTML = '';

            if (images.length === 0) {
                publicImagesWall.innerHTML = '<p>No images available yet.</p>';
                // Destroy Masonry if no items
                if (publicMasonryInstance) {
                    publicMasonryInstance.destroy();
                    publicMasonryInstance = null;
                }
                return;
            }

            // Create and append grid items for all fetched images
            images.forEach(image => {
                 const gridItem = createGridItemElement(image);
                 publicImagesWall.appendChild(gridItem); // Add the grid item to the wall
            });

            // Initialize or reload Masonry after adding all items
             if (typeof Masonry === 'undefined') {
                 console.error("Masonry library not loaded on homepage.");
                 return;
             }

             if (publicMasonryInstance) {
                 publicMasonryInstance.destroy();
                 publicMasonryInstance = null;
             }

             // Initialize Masonry only if there are items
             const gridItems = publicImagesWall.querySelectorAll('.grid-item');
             if (gridItems.length > 0) {
                 publicMasonryInstance = new Masonry( publicImagesWall, {
                   itemSelector: '.grid-item',
                   columnWidth: 200, // Must match CSS and dashboard config
                   gutter: 10
                 });

                  publicMasonryInstance.on('layoutComplete', function() {
                    console.log('Public Masonry layout complete');
                  });

                 publicMasonryInstance.layout(); // Initial layout
             } else {
                 console.log('No public grid items to initialize Masonry.');
             }


        } catch (error) {
            console.error('Error fetching public images:', error);
            publicImagesWall.innerHTML = '<p>Error loading images.</p>';
             if (publicMasonryInstance) {
                publicMasonryInstance.destroy();
                publicMasonryInstance = null;
            }
        }
    }


    // --- Initial Load ---
    // Fetch and display public images when the homepage loads
    fetchAndDisplayPublicImages();

}); // End of DOMContentLoaded listener