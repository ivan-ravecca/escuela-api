# Email Server

This project is a simple Express server that provides an endpoint for sending emails using Sendgrid.

## Project Structure

```
email-server
├── src
│   ├── app.ts          # Entry point of the application
│   └── routes
│       └── email.ts    # Route for sending emails
├── package.json         # NPM configuration file
├── tsconfig.json        # TypeScript configuration file
└── README.md            # Project documentation
```

## Setup Instructions

1. **Clone the repository:**

   ```
   git clone <repository-url>
   cd email-server
   ```

2. **Install dependencies:**

   ```
   npm install
   ```

3. **Run the server:**
   ```
   npm start
   ```

## Usage

To send an email, make a POST request to the `/send-email` endpoint with the following JSON body:

```json
{
  "email": "recipient@example.com",
  "name": "John Doe",
  "message": "Hello, this is a test email!"
}
```

## Dependencies

- **express**: A minimal and flexible Node.js web application framework.
- **nodemailer**: A module for Node.js applications to allow easy as cake email sending.

## License

Not sure which license should add
