class IndexController {
    handleGetRequest(req, res) {
        res.send('GET request handled');
    }

    handlePostRequest(req, res) {
        res.send('POST request handled');
    }

    // Add more methods as needed for other routes
}

module.exports = IndexController;