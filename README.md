# Escuela API

Comprehensive API for a nursing educational institution including:
- 🎓 Certificate and diploma management
- 🤖 AI assistant for academic guidance
- 📧 Email and notification sending
- 📚 Course and program catalog
- 🔐 Authentication and authorization

## ✨ New: AI Assistant

Complete conversational assistant system that helps prospective students find the ideal course:

- **Claude 4.5 Haiku** - Conversational AI in Spanish
- **Personalized recommendations** based on user profile
- **Lead capture** with email integration
- **Rate limiting** to prevent abuse
- **Database** with course catalog

📖 **See full documentation:**
- [ASSISTANT_README.md](./ASSISTANT_README.md) - Detailed technical guide

## 📑 Table of Contents

- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Required API Keys](#required-api-keys)
- [Environment Variables](#environment-variables)
- [Usage](#usage)
- [API Endpoints](#api-endpoints)
  - [AI Assistant (NEW)](#ai-assistant-new)
  - [Courses Catalog (NEW)](#courses-catalog-new)
  - [Authentication](#authentication)
  - [Diplomas/Certificates](#diplomascertificates)
  - [Email](#email)
- [Dependencies](#dependencies)
- [Deployment](#deployment)

## Getting Started

### Prerequisites

- Node.js 21.7.3
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
├── keys/
│   └── service-account-key.json      # Service account credentials
├── data/
│   └── courses.db                    # SQLite database (NEW)
├── src/
│   ├── app.ts                        # Application entry point
│   ├── config/
│   │   └── index.ts                  # Configuration (including Anthropic)
│   ├── controllers/
│   │   ├── authController.ts         # Authentication controller
│   │   └── assistantController.ts    # AI Assistant controller (NEW)
│   ├── database/
│   │   └── courseRepository.ts       # Course CRUD operations (NEW)
│   ├── middleware/
│   │   ├── authMiddleware.ts         # JWT authentication middleware
│   │   └── errorMiddleware.ts        # Error middleware
│   ├── routes/
│   │   ├── authRoutes.ts             # Authentication routes
│   │   ├── diploma.ts                # Certificate/diploma routes
│   │   ├── email.ts                  # Email sending routes
│   │   ├── assistantRoutes.ts        # AI Assistant routes (NEW)
│   │   └── courseRoutes.ts           # Course CRUD routes (NEW)
│   ├── services/
│   │   ├── assistantService.ts       # Claude AI integration (NEW)
│   │   ├── authService.ts            # Authentication service
│   │   ├── driveService.ts           # Google Drive service
│   │   └── ...                       # Other services
│   ├── scripts/
│   │   └── seedCourses.ts            # Database seeder (NEW)
│   ├── templates/                    # PDF templates for certificates
│   │   └── certificate.pdf           # Certificate template
│   └── types/
│       ├── index.ts                  # General interfaces
│       └── course.ts                 # Course-related types (NEW)
├── package.json                      # NPM configuration
├── tsconfig.json                     # TypeScript configuration
├── .env                              # Environment variables
├── .env.example                      # Environment variables template (NEW)
├── test-assistant.js                 # API testing script (NEW)
├── README.md                         # Main documentation
├── ASSISTANT_README.md               # AI Assistant docs (NEW)
├── DEPLOYMENT.md                     # Deployment guide (NEW)
├── FRONTEND_PROMPTS.md               # Frontend integration (NEW)
├── IMPLEMENTATION_SUMMARY.md         # Implementation summary (NEW)
└── CHECKLIST.md                      # Setup checklist (NEW)
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
| # AI Assistant (NEW)   |                                             |                             |
| `ANTHROPIC_API_KEY`    | API key for Claude (Anthropic)              | `sk-ant-api03-xxxxx`        |
| `ANTHROPIC_MODEL`      | Claude model to use                         | `claude-3-5-haiku-20241022` |
| `ANTHROPIC_MAX_TOKENS` | Max tokens for AI responses                 | `2048`                      |
| # Resend (already exists) | For email notifications                  |                             |
| `RESEND_API_KEY`       | API key for Resend email service            | `re_xxxxx`                  |
| `EMAIL_TO`             | Email to receive notifications              | `contacto@escuelaenfermeria.com.uy` |
| `EMAIL_FROM`           | Email to send from                          | `noreply@escuelaenfermeria.com.uy`  |

## Usage

After starting the server, you can access the API at `http://localhost:3000` (or whatever port you've configured).

### Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Configure .env file (copy from .env.example)
cp .env.example .env
# Edit .env and add your API keys

# 3. Build the project
npm run build

# 4. Initialize database with sample courses
npm run seed

# 5. Start the server
npm start
# or for development with auto-reload:
npm run dev
```

### Available Scripts

- `npm start` - Run the production server
- `npm run dev` - Run development server with auto-reload
- `npm run build` - Compile TypeScript to JavaScript
- `npm run seed` - Seed database with sample courses
- `npm run seed:dev` - Seed database in development mode
- `npm run mcp` - Run MCP server for course catalog

### Testing the AI Assistant

```bash
# Run automated tests
node test-assistant.js http://localhost:3000

# Or test manually with curl (see examples in API Endpoints section)
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

### AI Assistant (NEW)

🤖 **Asistente conversacional para orientación académica**

- `GET /assistant/welcome` - Obtener mensaje de bienvenida inicial
- `POST /assistant/chat` - Enviar mensaje al asistente y recibir respuesta
  - Rate limit: 10 requests/minuto
  - Body: `{ message: string, conversation_history?: Array<{role, content}> }`
  - Response: `{ response: string, recommended_courses?: Course[] }`
- `POST /assistant/interest` - Capturar lead cuando usuario hace click en "Me interesa"
  - Rate limit: 3 requests/hora
  - Body: `{ name: string, phone: string, email?: string, course_id: number, course_name: string }`
  - Se activa desde el botón "Me interesa" en cada tarjeta de curso

**Ejemplo de uso:**
```bash
# 1. Obtener bienvenida
curl https://api.escuelaenfermeria.com.uy/assistant/welcome

# 2. Chatear con el asistente
curl -X POST https://api.escuelaenfermeria.com.uy/assistant/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Hola, tengo 25 años y quiero estudiar enfermería"}'

# 3. Usuario hace click en "Me interesa" y envía sus datos
curl -X POST https://api.escuelaenfermeria.com.uy/assistant/interest \
  -H "Content-Type: application/json" \
  -d '{"name":"Juan Pérez","phone":"+598 99 123 456","email":"juan@example.com","course_id":1,"course_name":"Auxiliar de Enfermería"}'
```

📖 Ver [ASSISTANT_README.md](./ASSISTANT_README.md) para documentación completa.

### Courses Catalog (NEW)

📚 **API de gestión de catálogo de cursos**

- `GET /courses` - Listar todos los cursos
- `GET /courses/:id` - Obtener curso por ID
- `GET /courses/search/:query` - Buscar cursos por keyword
- `GET /courses/category/:category` - Filtrar por categoría (inicial/avanzado/especializacion)
- `GET /courses/modality/:modality` - Filtrar por modalidad (presencial/virtual/semipresencial)
- `POST /courses` - Crear nuevo curso (⚠️ proteger con auth en producción)
- `PUT /courses/:id` - Actualizar curso (⚠️ proteger con auth en producción)
- `DELETE /courses/:id` - Eliminar curso (⚠️ proteger con auth en producción)

**Ejemplo de respuesta:**
```json
{
  "courses": [
    {
      "id": 1,
      "name": "Auxiliar de Enfermería",
      "url": "https://escuelaenfermeria.com.uy/cursos/auxiliar-enfermeria",
      "description": "Formación básica en enfermería...",
      "duration_hours": 400,
      "modality": "presencial",
      "category": "inicial",
      "requirements": "Primaria completa, edad mínima 18 años",
      "job_opportunities": "Hospitales públicos y privados..."
    }
  ],
  "total": 7
}
```

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

### Core
- **express** - Web application framework
- **typescript** - Type safety and modern JavaScript features
- **helmet** - Security headers
- **cors** - Cross-origin resource sharing

### Authentication & Security
- **jsonwebtoken** - JWT authentication
- **google-auth-library** - Google OAuth
- **express-rate-limit** - Rate limiting (NEW)

### AI & Data
- **@anthropic-ai/sdk** - Claude AI integration (NEW)
- **@modelcontextprotocol/sdk** - MCP for course catalog (NEW)
- **better-sqlite3** - SQLite database (NEW)

### Email & Notifications
- **resend** - Modern email API
- **@sendgrid/mail** - SendGrid email (legacy)

### Documents & Media
- **pdf-lib** - PDF generation and manipulation
- **qrcode** - QR code generation
- **googleapis** - Google Drive API

### Development
- **ts-node-dev** - Development server with auto-reload
- **prettier** - Code formatting
- **eslint** - Code linting


### Quick Deploy

1. **Configure environment variables:**
  ```bash
  # Required for AI Assistant
  ANTHROPIC_API_KEY=sk-ant-api03-xxxxx
  RESEND_API_KEY=re_xxxxx
  EMAIL_TO=contacto@escuelaenfermeria.com.uy
  EMAIL_FROM=noreply@escuelaenfermeria.com.uy
  ```

2. **Build and initialize:**
  ```bash
  npm install
  npm run build
  npm run seed
  ```

3. **Start production server:**
  ```bash
  npm start
  # or with PM2:
  pm2 start dist/app.js --name escuela-api
  ```

4. **Configure reverse proxy (Nginx):**
  ```nginx
  server {
     listen 80;
     server_name api.escuelaenfermeria.com.uy;
     location / {
        proxy_pass http://localhost:3000;
     }
  }
  ```

5. **Setup SSL with Let's Encrypt:**
  ```bash
  sudo certbot --nginx -d api.escuelaenfermeria.com.uy
  ```

### Platform-Specific Deploy

- **Railway/Render**: Connect the Git repo and configure env vars
- **Heroku**: See [DEPLOYMENT.md](./DEPLOYMENT.md#deploy-on-heroku)
- **VPS**: See [DEPLOYMENT.md](./DEPLOYMENT.md#deploy-on-vps-ubuntu)


## 📚 Additional Documentation

- [ASSISTANT_README.md](./ASSISTANT_README.md) - AI Assistant technical guide
- [ARCHITECTURE.md](./ARCHITECTURE.md) - System architecture and diagrams
- [DOCKER_DATABASE.md](./DOCKER_DATABASE.md) - MariaDB setup with Docker

## 📊 Cost Estimation

**Claude 4.5 Haiku:**
- ~$0.003 per conversation
- 1000 conversations/month: ~$3 USD
- 10,000 conversations/month: ~$30 USD

**Other services:**
- Resend: Free tier up to 3000 emails/month
- Hosting: Variable depending on provider

## 🔒 Security

- ✅ CORS configured
- ✅ Helmet for security headers
- ✅ Rate limiting enabled
- ✅ JWT authentication
- ✅ Environment variables protected
- ⚠️ CRUD endpoints require auth in production

## 🤝 Contributing

1. Fork the project
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request
