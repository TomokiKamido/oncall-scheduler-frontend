# Development Guidelines

This document outlines the guidelines for developing the Oncall Scheduler application.

## Getting Started

To get started, you'll need to have Node.js and npm installed. You can then install the dependencies by running:

```bash
npm install
```

## Running the Application

To run the application in development mode, use the following command:

```bash
npm start
```

This will start the development server and open the application in your default browser.

## Building the Application

To build the application for production, use the following command:

```bash
npm run build
```

This will create a `build` directory with the optimized and minified application code.

## Coding Style

We use Prettier to enforce a consistent coding style. Please make sure to format your code before committing.

## Testing

We use Jest and React Testing Library for testing. To run the tests, use the following command:

```bash
npm test
```

## Deployment

The application is deployed to Firebase Hosting. To deploy the application, you'll need to have the Firebase CLI installed and be authenticated. You can then deploy the application using the following command:

```bash
firebase deploy
```
