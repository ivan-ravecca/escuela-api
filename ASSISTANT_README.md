# Escuela API - AI Assistant

Este README documenta la funcionalidad del asistente de IA para orientación académica.

## 🤖 Asistente de Orientación Académica

Sistema de asistente AI que ayuda a los potenciales estudiantes a encontrar el curso o carrera de enfermería más adecuado según su perfil.

### Tecnologías

- **Claude 3.5 Haiku** - Modelo de IA de Anthropic (económico y rápido)
- **MCP (Model Context Protocol)** - Para gestión del catálogo de cursos
- **SQLite** - Base de datos de cursos
- **Express Rate Limiting** - Protección contra abuso
- **Resend** - Envío de emails para captura de leads

## 🚀 Configuración

### 1. Variables de Entorno

Agrega estas variables a tu archivo `.env`:

```bash
# Anthropic API
ANTHROPIC_API_KEY=tu_api_key_aqui
ANTHROPIC_MODEL=claude-3-5-haiku-20241022
ANTHROPIC_MAX_TOKENS=2048

# Ya existentes
RESEND_API_KEY=tu_resend_key
EMAIL_TO=destinatario@escuelaenfermeria.com.uy
EMAIL_FROM=noreply@escuelaenfermeria.com.uy
```

### 2. Inicializar Base de Datos

Primero, compila el proyecto y luego ejecuta el seeder:

```bash
npm run build
npm run seed
```

O en desarrollo:

```bash
npm run seed:dev
```

### 3. Scripts en package.json

Agrega estos scripts a tu `package.json`:

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

Obtiene el mensaje de bienvenida inicial.

**Response:**
```json
{
  "message": "¡Hola! 👋 Soy tu asistente virtual..."
}
```

### POST /assistant/chat

Envía un mensaje al asistente y recibe recomendaciones.

**Rate Limit:** 10 requests/minuto por IP

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

Captura el interés de un estudiante (envía email).

**Rate Limit:** 3 requests/hora por IP

**Request:**
```json
{
  "name": "Juan Pérez",
  "phone": "+598 99 123 456",
  "email": "juan@example.com",
  "interested_courses": ["Auxiliar de Enfermería", "Primeros Auxilios"]
}
```

**Response:**
```json
{
  "message": "Gracias por tu interés. Nos pondremos en contacto pronto.",
  "success": true
}
```

## 🗄️ Base de Datos

### Estructura de Cursos

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

### Operaciones CRUD

```typescript
import { CourseRepository } from "./database/courseRepository";

// Obtener todos los cursos
const courses = CourseRepository.getAllCourses();

// Buscar por categoría
const initialCourses = CourseRepository.getCoursesByCategory("inicial");

// Buscar por modalidad
const onlineCourses = CourseRepository.getCoursesByModality("virtual");

// Buscar por texto
const searchResults = CourseRepository.searchCourses("pediatría");

// Crear curso
const newCourse = CourseRepository.createCourse({
  name: "Nuevo Curso",
  url: "https://...",
  // ... otros campos
});
```

## 🎯 Flujo de Conversación

1. Usuario abre el widget de chat
2. Recibe mensaje de bienvenida (`/assistant/welcome`)
3. Comienza conversación enviando mensajes (`/assistant/chat`)
4. El asistente hace preguntas para entender su perfil
5. Una vez tiene suficiente información, recomienda 1-3 cursos
6. Pregunta si quiere ser contactado
7. Usuario envía sus datos (`/assistant/interest`)
8. Sistema envía email al equipo de ventas

## 🛡️ Seguridad

- **Rate Limiting**: Previene abuso de la API
- **CORS**: Ya configurado en tu app.ts
- **Validación**: Todos los endpoints validan inputs
- **Sanitización**: Los mensajes son procesados de forma segura

