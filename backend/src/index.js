const express = require('express');
const bodyParser = require('body-parser');
const IndexController = require('./controllers/index').IndexController;

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Initialize controllers
const indexController = new IndexController();

// Define routes
app.get('/', indexController.home);
app.get('/about', indexController.about);

// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});