
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const port = process.env.PORT || 3000;

// Enable CORS for all routes
app.use(cors());


const mongoose = require('mongoose');
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/product');
const blogRoutes = require('./routes/blog');
const IndexController = require('./controllers/index');
require('dotenv').config();



// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Connect to MongoDB using .env
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Auth routes
app.use('/api/auth', authRoutes);

// Product routes
app.use('/api/products', productRoutes);

// Blog routes
app.use('/api/blogs', blogRoutes);


// Initialize controllers
const indexController = new IndexController();

// Example routes (update as needed)
app.get('/', (req, res) => indexController.handleGetRequest(req, res));
app.get('/about', (req, res) => indexController.handleGetRequest(req, res));

// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});