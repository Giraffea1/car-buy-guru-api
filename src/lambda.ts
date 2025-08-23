import serverless from 'serverless-http';
import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import app from './app';

// Extend the request interface to include Lambda properties
declare global {
  namespace Express {
    interface Request {
      lambda?: {
        event: APIGatewayProxyEvent;
        context: Context;
      };
    }
  }
}

// Lambda handler
const handler = serverless(app, {
  // Binary media types for file uploads
  binary: ['image/*', 'application/pdf'],
  
  // Request/response transformations
  request: (request: any, event: APIGatewayProxyEvent, context: Context) => {
    // Add Lambda event and context to request
    request.lambda = { event, context };
  },
  
  response: (response: any, event: APIGatewayProxyEvent, context: Context) => {
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

export { handler };