# Escuela API - AI Assistant

This README documents the functionality of the AI assistant for academic guidance.

## 🤖 Academic Guidance Assistant

AI assistant system that helps prospective students find the most suitable nursing course or career based on their profile.

### Technologies

- **Claude 3.5 Haiku** - Anthropic AI model (fast and economical)
- **MCP (Model Context Protocol)** - For course catalog management
- **SQLite** - Course database
- **Express Rate Limiting** - Protection against abuse
- **Resend** - Email sending for lead capture

## 🚀 Setup

### 1. Environment Variables

Add these variables to your `.env` file:

```bash
# Anthropic API
ANTHROPIC_API_KEY=your_api_key_here
ANTHROPIC_MODEL=claude-3-5-haiku-20241022
ANTHROPIC_MAX_TOKENS=2048

# Existing
RESEND_API_KEY=your_resend_key
EMAIL_TO=recipient@escuelaenfermeria.com.uy
EMAIL_FROM=noreply@escuelaenfermeria.com.uy
```

### 2. Initialize Database

First, build the project and then run the seeder:

```bash
npm run build
npm run seed
```

Or in development:

```bash
npm run seed:dev
```

### 3. Scripts in package.json

Add these scripts to your `package.json`:

```json
{
  "scripts": {
    "seed": "node dist/scripts/seedCourses.js",
    "seed:dev": "ts-node src/scripts/seedCourses.ts",
    "mcp": "node dist/mcp/courseCatalogServer.js"
  }
}
```

## 📡 API Endpoints

### GET /assistant/welcome

Gets the initial welcome message.

**Response:**
```json
{
  "message": "¡Hola! 👋 Soy tu asistente virtual..."
}
```

### POST /assistant/chat

Sends a message to the assistant and receives recommendations.

**Rate Limit:** 10 requests/minute per IP

**Request:**
```json
{
  "message": "Hola, quiero estudiar enfermería",
  "conversation_history": [
    {
      "role": "user",
      "content": "mensaje anterior"
    },
    {
      "role": "assistant",
      "content": "respuesta anterior"
    }
  ]
}
```

**Response:**
```json
{
  "response": "¡Genial que quieras estudiar enfermería! Para poder recomendarte...",
  "recommended_courses": [
    {
      "id": 1,
      "name": "Auxiliar de Enfermería",
      "url": "https://...",
      "description": "...",
      "duration_hours": 400,
      "modality": "presencial",
      "category": "inicial"
    }
  ]
}
```

### POST /assistant/interest

Captures a student's interest (sends email).


**Rate Limit:** 3 requests/hour per IP

**Request:**
```json
{
  "name": "Juan Pérez",
  "phone": "+598 99 123 456",
  "email": "john@example.com",
  "interested_courses": ["Nursing Assistant", "First Aid"]
}
```

**Response:**
```json
{
  "message": "Gracias por tu interés. Nos pondremos en contacto pronto.",
  "success": true
}
```

## 🗄️ Database

### Course Structure

```sql
CREATE TABLE courses (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  description TEXT NOT NULL,
  duration_hours INTEGER NOT NULL,
  modality TEXT CHECK(modality IN ('presencial', 'virtual', 'semipresencial')),
  requirements TEXT NOT NULL,
  syllabus_summary TEXT NOT NULL,
  schedule TEXT,
  category TEXT CHECK(category IN ('inicial', 'avanzado', 'especializacion')),
  job_opportunities TEXT NOT NULL,
  created_at DATETIME,
  updated_at DATETIME
);
```

### CRUD Operations

```typescript
import { CourseRepository } from "./database/courseRepository";

// Get all courses
const courses = CourseRepository.getAllCourses();

// Search by category
const initialCourses = CourseRepository.getCoursesByCategory("inicial");

// Search by modality
const onlineCourses = CourseRepository.getCoursesByModality("virtual");

// Search by text
const searchResults = CourseRepository.searchCourses("pediatría");

// Create course
const newCourse = CourseRepository.createCourse({
  name: "New Course",
  url: "https://...",
  // ... other fields
});
```

## 🎯 Conversation Flow

1. User opens the chat widget
2. Receives welcome message (`/assistant/welcome`)
3. Starts conversation by sending messages (`/assistant/chat`)
4. Assistant asks questions to understand their profile
5. Once enough information is gathered, recommends 1-3 courses
6. Asks if they want to be contacted
7. User sends their data (`/assistant/interest`)
8. System sends email to the sales team

## 🛡️ Security

- **Rate Limiting**: Prevents API abuse
- **CORS**: Already configured in your app.ts
- **Validation**: All endpoints validate inputs
- **Sanitization**: Messages are processed securely

## 📚 Additional Documentation

- [README.md](./README.md) - Main project documentation
- [ARCHITECTURE.md](./ARCHITECTURE.md) - System architecture and diagrams
- [DOCKER_DATABASE.md](./DOCKER_DATABASE.md) - MariaDB setup with Docker

