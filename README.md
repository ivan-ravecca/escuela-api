# Escuela API

This project is a comprehensive API for managing certificates and diplomas for an educational institution. It provides authenticated endpoints for generating QR codes, creating certificates, and managing educational resources.

## Table of Contents

- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Required API Keys](#required-api-keys)
    - [Google OAuth](#google-oauth)
    - [SendGrid](#sendgrid)
    - [Google Drive API](#google-drive-api)
- [Environment Variables](#environment-variables)
- [Usage](#usage)
- [API Endpoints](#api-endpoints)
  - [Authentication](#authentication)
  - [Diplomas/Certificates](#diplomascertificates)
  - [Email](#email)
  - [Usage Examples](#usage-examples)
    - [Generating a Certificate](#generating-a-certificate)
    - [Generating a QR Code](#generating-a-qr-code)
- [Dependencies](#dependencies)
- [Deployment](#deployment)

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Database (MongoDB, PostgreSQL, etc.)

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/username/escuela-api.git
   cd escuela-api
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Set up environment variables (see [Environment Variables](#environment-variables) section).

4. Start the server:
   ```bash
   npm start
   ```

## Project Structure

```
escuela-api
├── Keys
│   ├── service-account-key.json   # Service account credentials
├── src
│   ├── app.ts                     # Entry point of the application
│   ├── controllers                # Business logic controllers
│   │   └── authController.ts      # Authentication controller
│   ├── middleware                 # Express middlewares
│   │   ├── authMiddleware.ts      # JWT authentication middle
│   │   └── errorMiddleware.ts     # Error middleware
│   ├── routes                     # API routes
│   │   ├── authRoutes.ts          # Authentication routes
│   │   ├── diploma.ts             # Certificate/diploma routes
│   │   └── email.ts               # Email sending routes
│   ├── services                   # Business services (list of)
│   │── templates                  # PDF templates for certificates
│   │   └── certificate.pdf        # Certificate template with form fields
│   └── types                      # List of interfaces
├── package.json                   # NPM configuration file
├── tsconfig.json                  # TypeScript configuration file
├── .prettierrc                    # Prettier
├── .env                           # Env file
└── README.md                      # Project documentation
```

## Environment Variables

Create a `.env` file in the root directory and add the following variables:

| Variable               | Description                                 | Example                     |
| ---------------------- | ------------------------------------------- | --------------------------- |
| # Server Configuration |                                             |                             |
| `PORT`                 | Port the server will run on                 | `3000`                      |
| `NODE_ENV`             | Environment (development, production, test) | `development`               |
| # Authentication       |                                             |                             |
| `GOOGLE_CLIENT_ID`     | Client ID for Google OAuth                  | `your_google_client_id`     |
| `GOOGLE_CLIENT_SECRET` | Client Secret for Google OAuth              | `your_google_client_secret` |
| `JWT_SECRET`           | Secret key for JWT token generation         | `your_jwt_secret_key`       |
| `HASH_SECRET`          | Secret key for hashing sensitive data       | `your_hash_secret_key`      |
| # Email (SendGrid)     |                                             |                             |
| `SENDGRID_API_KEY`     | API key for SendGrid email service          | `your_sendgrid_api_key`     |
| `FROM_EMAIL`           | Email address to send from                  | `your-email@example.com`    |
| `FROM_NAME`            | Name to display as sender                   | `Your Name or Organization` |
| # Google Drive API     |                                             |                             |
| `GOOGLE_API_KEY`       | API key for Google Drive integration        | `your_google_api_key`       |
| # URLs                 |                                             |                             |
| `BASE_URL`             | Base URL for API                            | `http://localhost:3000`     |
| `FRONTEND_URL`         | URL for the frontend application            | `http://localhost:3001`     |

## Usage

After starting the server, you can access the API at `http://localhost:3000` (or whatever port you've configured).

Run the server

```bash
npm start
```

For development with auto-reload:

```bash
npm run dev
```

## Required API Keys

### Google OAuth

To use the Google authentication features:

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Navigate to "APIs & Services" > "Credentials"
4. Create an OAuth 2.0 Client ID
5. Configure the authorized redirect URLs (e.g., http://localhost:3000/auth/google/callback)
6. Copy the Client ID and Client Secret to your ⚙️ `.env` file

### SendGrid

For email functionality:

1. Create an account on [SendGrid](https://sendgrid.com/)
2. Go to API Keys and create a new key
3. Copy the API key to your ⚙️ `.env` file

### Google Drive API

For accessing Google Drive files:

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Enable the Google Drive API
3. Create an API Key
4. Copy the API key to your ⚙️ `.env` file

## API Endpoints

### Authentication

This API uses JWT (JSON Web Tokens) for authentication. To access protected endpoints, include the token in the Authorization header:

```
Authorization: Bearer <your_token>
```

- `POST /auth/login` - Login with Google token
- `POST /api/auth/verify` - Verify JWT token validity
- `GET /api/auth/me` - Get current user information (requires authentication)

### Diplomas/Certificates

- `GET /diploma/generate` - Generate a QR code from a Google Drive URL (requires authentication)
- `POST /diploma/certificate` - Generate a certificate PDF (requires authentication)
- `GET /diploma/:diplomaId` - View a specific diploma by ID

### Email

- `POST /send-email` - Send an email notification

### Usage Examples

#### Generating a Certificate

```typescript
// Request
fetch("/diploma/certificate", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  },
  body: JSON.stringify({
    studentName: "John Doe",
    courseName: "Nursing Fundamentals",
    courseDate: "May 15, 2025",
    driveUrl: "https://drive.google.com/file/d/your-file-id/view",
  }),
});

// Response is a PDF Buffer
```

#### Generating a QR Code

```typescript
// Request
fetch(
  "/diploma/generate?link=https://drive.google.com/file/d/your-file-id/view",
  {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  },
);

// Response is a PNG image
```

## Dependencies

- express: Web application framework
- pdf-lib: PDF generation and form filling
- qrcode: QR code generation
- jsonwebtoken: JWT authentication
- @sendgrid/mail: Email sending
- google-auth-library: Google authentication
- googleapis: Google API access

## Deployment

Instructions for deploying to production environments:

1. Set all required environment variables
2. Build the project: `npm run build`
3. Start the production server: `npm run start:prod`
