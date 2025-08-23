const serverless = require('serverless-http');
const app = require('./app');

// Lambda handler
const handler = serverless(app, {
  // Binary media types for file uploads
  binary: ['image/*', 'application/pdf'],
  
  // Request/response transformations
  request: (request, event, context) => {
    // Add Lambda event and context to request
    request.lambda = { event, context };
  },
  
  response: (response, event, context) => {
    // Add CORS headers for Lambda
    response.headers = {
      ...response.headers,
      'Access-Control-Allow-Origin': process.env.FRONTEND_URL || '*',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type,Authorization'
    };
  }
});

module.exports = { handler };
