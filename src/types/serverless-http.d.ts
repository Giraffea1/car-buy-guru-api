declare module 'serverless-http' {
  import { Application } from 'express';
  import { APIGatewayProxyHandler } from 'aws-lambda';

  interface ServerlessOptions {
    binary?: string[];
    request?: (request: any, event: any, context: any) => void;
    response?: (response: any, event: any, context: any) => void;
  }

  function serverless(app: Application, options?: ServerlessOptions): APIGatewayProxyHandler;
  
  export = serverless;
}
