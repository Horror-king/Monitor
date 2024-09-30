// Import required libraries
const express = require('express');
const axios = require('axios');

// Initialize the express app
const app = express();

// Google Custom Search API credentials (replace with your actual credentials)
const API_KEY = 'AIzaSyCLBfvIqHiygU9ww9567Q3GF0BFLNmcRHM';  // Replace with your API Key
const CX = 'c5b8108dd2da64b29';  // Replace with your Custom Search Engine ID

// Maximum number of images per request from Google API is 10
const MAX_IMAGES_PER_REQUEST = 10;

// Endpoint to search images using Google Custom Search API
app.get('/google', async (req, res) => {
  const query = req.query.query;

  // Ensure that a query is provided
  if (!query) {
    return res.status(400).json({ error: 'Please provide a search query.' });
  }

  // Split the query to separate search term and the requested number of images
  const [searchTerm, limit] = query.split('-');

  // Default number of images if not provided or invalid
  let numImages = parseInt(limit, 10) || 10;

  // Limit the number of images to a maximum of 50
  if (numImages > 50) numImages = 50;

  try {
    const allImageURLs = [];

    // We need to make multiple requests if numImages > 10
    let startIndex = 1; // This determines the starting index for each request

    while (allImageURLs.length < numImages) {
      const remainingImages = numImages - allImageURLs.length;
      const fetchLimit = remainingImages > MAX_IMAGES_PER_REQUEST ? MAX_IMAGES_PER_REQUEST : remainingImages;

      // Make the request to Google Custom Search API
      const response = await axios.get(`https://www.googleapis.com/customsearch/v1`, {
        params: {
          q: searchTerm,
          searchType: 'image',
          key: API_KEY,
          cx: CX,
          num: fetchLimit,        // Fetch the number of images left to get
          start: startIndex       // Pagination starts from this index
        }
      });

      // Check if there are any results
      if (!response.data.items || response.data.items.length === 0) {
        break;
      }

      // Get the list of image URLs from the current request
      const imageURLs = response.data.items.map(item => item.link);

      // Add the image URLs to the list of all images
      allImageURLs.push(...imageURLs);

      // Update the startIndex for the next batch
      startIndex += fetchLimit;
    }

    // Return URLs as a JSON response
    res.status(200).json({ query: searchTerm, limit: numImages, images: allImageURLs });

  } catch (error) {
    console.error('Error fetching image results:', error);

    // Error handling
    if (error.response) {
      return res.status(error.response.status).json({ error: error.response.data });
    } else if (error.request) {
      return res.status(500).json({ error: 'No response from Google API.' });
    } else {
      return res.status(500).json({ error: 'Something went wrong while processing your request.' });
    }
  }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
