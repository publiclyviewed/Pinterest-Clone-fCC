document.addEventListener('DOMContentLoaded', () => {
    const publicImagesWall = document.getElementById('public-images-wall');

    // Variable to hold the Masonry instance for the public wall
    let publicMasonryInstance = null;

    // --- Placeholder Image URL ---
    // Use the same placeholder as dashboard.js
    const BROKEN_IMAGE_PLACEHOLDER = 'https://via.placeholder.com/200x150.png?text=Broken+Image';
    // -----------------------------

     // Function to create a single grid item element for an image
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
         // imgElement.style.maxWidth = '100%'; // Handled by CSS


         // --- Add Error Handling for Broken Images ---
         // Use jQuery to select the image element and attach the error handler
         $(imgElement).on('error', function() {
             console.error('Image failed to load:', this.src);
             // Replace the source with the placeholder image
             this.src = BROKEN_IMAGE_PLACEHOLDER;
              $(this).addClass('broken-image');

             // Important: Tell Masonry to relayout the item, as the size might change
             // Find the grid item container
             const parentGridItem = $(this).closest('.grid-item')[0];
             if (publicMasonryInstance && parentGridItem) {
                 publicMasonryInstance.layout(); // Relayout the grid
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

            publicImagesWall.innerHTML = '';

            if (images.length === 0) {
                publicImagesWall.innerHTML = '<p>No images available yet.</p>';
                if (publicMasonryInstance) {
                    publicMasonryInstance.destroy();
                    publicMasonryInstance = null;
                }
                return;
            }

            // Create and append grid items for all fetched images
            images.forEach(image => {
                 const gridItem = createGridItemElement(image);
                 publicImagesWall.appendChild(gridItem);
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

                  // Images might still be loading, Masonry should handle this via pkgd,
                  // but an explicit layout call after images are appended is standard.
                   publicMasonryInstance.layout();
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
    fetchAndDisplayPublicImages();

}); // End of DOMContentLoaded listener