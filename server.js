const express = require('express');
const app = express(); 
const port = process.env.PORT || 3000; // Use environment variable or default port 3000

app.use(express.static('public'));

// Basic route
// app.get('/', (req, res) => {
  //res.send('Pinterest Clone server is running!');//
//}); //

// Start the server
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});