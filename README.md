# Pinterest Clone

## Project Objective
A Pinterest clone built as a coding interview preparation challenge, fulfilling the requirements outlined in the Free Code Camp build challenge (link to challenge if available). The application aims to replicate core Pinterest functionalities like image linking, user walls, and Browse.

## Features
- [ ] User Authentication (via GitHub)
- [ ] Link and display images
- [ ] Delete owned images
- [ ] User-specific image wall
- [ ] Browse other users' walls
- [ ] Handle broken images with placeholders
- [ ] Pinterest-style image grid (Masonry.js)

## Technologies Used
- Backend: Node.js, Express.js
- Database: [Will decide later, likely MongoDB]
- Frontend: HTML, CSS, JavaScript, jQuery, Masonry.js
- Authentication: Passport.js, Passport-GitHub
- ... (Add other libraries/APIs as you use them)

## Setup and Installation

1.  **Clone the repository:**
    ```bash
    git clone 
    cd pinterest-clone
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    # or
    yarn install
    ```
3.  **Set up environment variables:**
    Create a `.env` file in the root directory and add necessary variables (e.g., Database connection string, GitHub OAuth keys).
    ```env
    # Example .env content
    # MONGODB_URI=your_mongodb_connection_string
    # GITHUB_CLIENT_ID=your_github_client_id
    # GITHUB_CLIENT_SECRET=your_github_client_secret
    # SESSION_SECRET=a_long_random_string
    ```
4.  **Run the application:**
    ```bash
    npm start
    # or
    yarn start
    ```
    The server should run on `http://localhost:3000` (or the specified port).

## Development
- `npm start`: Starts the server using nodemon for automatic restarts.

## Contributing
(Optional section: Describe how others can contribute)

## License
(Optional section: Link to your project's license)

## Acknowledgements
- Free Code Camp for the project inspiration.
- Masonry.js, jQuery, etc.