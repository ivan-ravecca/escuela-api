# 🏗️ Arquitectura del Sistema

## Diagrama de Componentes

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React)                         │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────┐     │
│  │ Chat Widget  │  │ Course Cards │  │ Lead Capture Form  │     │
│  │              │  │      +       │  │                    │     │
│  │              │  │"Me interesa" │  │  (per course)      │     │
│  └──────┬───────┘  └───────┬──────┘  └──────────┬─────────┘     │
│         │                  │                    │               │
└─────────┼──────────────────┼────────────────────┼───────────────┘
          │                  │                    │
          │  HTTPS           │                    │
          │                  │                    │
┌─────────▼──────────────────▼────────────────────▼───────────────┐
│                    NGINX (Reverse Proxy)                        │
│                  api.escuelaenfermeria.com.uy                   │
└─────────┬───────────────────────────────────────────────────────┘
          │
          │
┌─────────▼────────────────────────────────────────────────────────┐
│                    EXPRESS API SERVER                            │
│                      (Node.js + TypeScript)                      │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │                    MIDDLEWARE LAYER                        │  │
│  │  ┌──────────┐ ┌──────────────┐ ┌──────────────────────┐    │  │
│  │  │   CORS   │ │ Rate Limiter │ │   Authentication     │    │  │
│  │  │  Helmet  │ │ 10/min chat  │ │      (JWT)           │    │  │
│  │  │          │ │ 3/hour leads │ │                      │    │  │
│  │  └──────────┘ └──────────────┘ └──────────────────────┘    │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │                     ROUTES                                 │  │
│  │  ┌──────────┐ ┌──────────┐ ┌────────┐ ┌──────────────┐     │  │
│  │  │/assistant│ │ /courses │ │ /email │ │   /diploma   │     │  │
│  │  └────┬─────┘ └────┬─────┘ └───┬────┘ └───────┬──────┘     │  │
│  └───────┼────────────┼───────────┼──────────────┼            │  │
│          │            │           │              │            │  │
│  ┌───────▼────────────▼───────────▼──────────────▼──────────┐ │  │
│  │                   CONTROLLERS                            │ │  │
│  │  ┌─────────────┐ ┌─────────────┐ ┌──────────────────┐    │ │  │
│  │  │ Assistant   │ │   Course    │ │   Email/Diploma  │    │ │
│  │  │ Controller  │ │ Controller  │ │   Controllers    │    │ │
│  │  └──────┬──────┘ └──────┬──────┘ └─────────┬────────┘    │ │
│  └─────────┼───────────────┼──────────────────┼─────────────┘ │
│            │               │                  │               │
│  ┌─────────▼───────────────▼──────────────────▼─────────────┐ │
│  │                     SERVICES                             │ │
│  │  ┌─────────────┐ ┌──────────────┐ ┌──────────────────┐   │ │
│  │  │  Assistant  │ │  Course      │ │   Email/Drive    │   │ │
│  │  │   Service   │ │  Repository  │ │    Services      │   │ │
│  │  └──────┬──────┘ └──────┬───────┘ └────────┬─────────┘   │ │
│  └─────────┼───────────────┼──────────────────┼─────────────┘ │
│            │               │                  │               │
│  ┌─────────▼───────────────▼──────────────────┴─────────────┐ │
│  │               DATABASE CONNECTION LAYER                  │ │
│  │  ┌──────────────────────────────────────────────────────┐│ │
│  │  │  Connection Pool (mysql2)                            ││ │
│  │  │  - Initialize tables                                 ││ │
│  │  │  - Manage connections                                ││ │
│  │  └──────────────────────────────────────────────────────┘│ │
│  └─────────────────────────────────────────────────────────── │
└────────────┬───────────────┬──────────────────┬───────────────┘
             │               │                  │
             │               │                  │
   ┌─────────▼─────┐  ┌─────▼──────────┐   ┌──▼─────────────┐
   │  Anthropic    │  │   MariaDB      │   │    Resend      │
   │  Claude API   │  │   (Docker)     │   │   Email API    │
   │ Haiku 3.5     │  │  Port 3307     │   │                │
   └───────────────┘  └────────────────┘   └────────────────┘
```

## Flujo de Conversación del Asistente

```
┌──────────────┐
│   USUARIO    │
│  (Frontend)  │
└──────┬───────┘
       │
       │ 1. GET /assistant/welcome
       ▼
┌──────────────────────┐
│   Express Server     │
│  welcomeController() │──────┐
└──────────────────────┘      │
                              │ 2. Generate welcome message
                    ┌─────────▼────────────┐
                    │  Assistant Service   │
                    │ generateWelcome()    │
                    └─────────┬────────────┘
                              │ 3. Return welcome text
       ┌──────────────────────┘
       │
       ▼
┌──────────────┐
│   USUARIO    │
│ reads welcome│
└──────┬───────┘
       │
       │ 4. POST /assistant/chat
       │    { message: "Hola, quiero estudiar...",
       │      conversation_history: [] }
       ▼
┌──────────────────────┐
│   Rate Limiter       │ (10/min)
└──────┬───────────────┘
       │ 5. Allow if within limit
       ▼
┌──────────────────────┐
│   Chat Controller    │
│   chat()             │
└──────┬───────────────┘
       │
       │ 6. Call assistant service
       ▼
┌─────────────────────────────┐
│   Assistant Service         │
│   chat(message, history)    │
└──────┬──────────────────────┘
       │
       │ 7. Get all courses from DB
       ▼
┌─────────────────────────────┐
│   Course Repository         │
│   getAllCourses()           │
└──────┬──────────────────────┘
       │
       │ 8. Courses array
       ▼
┌─────────────────────────────┐
│   Assistant Service         │
│   Build context with        │
│   courses + message         │
└──────┬──────────────────────┘
       │
       │ 9. POST to Claude API
       │    { system: prompt,
       │      messages: [...history, user_msg],
       │      model: "haiku" }
       ▼
┌─────────────────────────────┐
│   Anthropic Claude API      │
│   Process with AI           │
└──────┬──────────────────────┘
       │
       │ 10. AI response
       ▼
┌─────────────────────────────┐
│   Assistant Service         │
│   Extract recommended       │
│   courses from response     │
└──────┬──────────────────────┘
       │
       │ 11. Return { response, recommended_courses }
       ▼
┌──────────────────────┐
│   Chat Controller    │
│   Format response    │
└──────┬───────────────┘
       │
       │ 12. JSON response
       ▼
┌──────────────┐
│   USUARIO    │
│ sees response│
└──────┬───────┘
       │
       │ 13. Conversation continues...
       │     (repeats steps 4-12 with updated history)
       │
       │ 14. User clicks "Me interesa" button on course card
       │
       │ 15. POST /assistant/interest
       │     { course_id, course_name, name, phone, email }
       ▼
┌──────────────────────┐
│   Rate Limiter       │ (3/hour)
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│ Interest Controller  │
│ captureInterest()    │
└──────┬───────────────┘
       │
       │ 16. Send email via Resend
       ▼
┌─────────────────────────────┐
│      Resend API             │
│   Send lead notification    │
│   with course_id + name     │
│   to EMAIL_TO               │
└──────┬──────────────────────┘
       │
       │ 17. Email sent
       ▼
┌──────────────────────┐
│   EMAIL_TO           │
│   (School staff)     │
│   Receives lead      │
└──────────────────────┘
       │
       │ 18. Staff contacts user via WhatsApp
       ▼
┌──────────────┐
│   USUARIO    │
│  (WhatsApp)  │
└──────────────┘
```

## Data Flow - Course Management

```
┌──────────────┐
│   ADMIN      │
│ (via Postman │
│  or Admin UI)│
└──────┬───────┘
       │
       │ POST /courses
       │ { name, url, description, ... }
       ▼
┌──────────────────────┐
│   Course Controller  │
│   create()           │
└──────┬───────────────┘
       │
       │ Validate data
       ▼
┌─────────────────────────────┐
│   Course Repository         │
│   createCourse()            │
└──────┬──────────────────────┘
       │
       │ INSERT INTO courses
       ▼
┌─────────────────────────────┐
│   MariaDB Database          │
│   Docker container          │
│   Port 3307                 │
└──────┬──────────────────────┘
       │
       │ Return created course
       ▼
┌──────────────────────┐
│   ADMIN              │
│   Course created     │
└──────────────────────┘

       │
       │ Now available in catalog
       ▼
┌─────────────────────────────┐
│   Assistant Service         │
│   Uses in next chat()       │
│   as part of course_catalog │
└─────────────────────────────┘
```

## Security Layers

```
Request Flow with Security:

Internet
   │
   ▼
┌─────────────────────┐
│  1. HTTPS/TLS       │ ← SSL Certificate
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│  2. CORS Filter     │ ← Only escuelaenfermeria.com.uy
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│  3. Helmet Headers  │ ← Security headers
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│  4. Rate Limiter    │ ← 10 req/min (chat)
└─────────┬───────────┘     3 req/hour (lead)
          │
          ▼
┌─────────────────────┐
│  5. Input          │ ← Validate & sanitize
│     Validation      │
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│  6. Controller      │ ← Business logic
│     Logic           │
└─────────┬───────────┘
          │
          ▼
      Response
```

## Database Schema

```sql
-- MariaDB Schema
CREATE TABLE courses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  url TEXT NOT NULL,
  description TEXT NOT NULL,
  duration_hours INT NOT NULL,
  modality ENUM('presencial', 'virtual', 'semipresencial') NOT NULL,
  requirements TEXT NOT NULL,
  syllabus_summary TEXT NOT NULL,
  schedule TEXT,
  category ENUM('inicial', 'avanzado', 'especializacion') NOT NULL,
  job_opportunities TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_courses_category ON courses(category);
CREATE INDEX idx_courses_modality ON courses(modality);
```

## Technology Stack

```
┌─────────────────────────────────────────────┐
│              PRESENTATION LAYER             │
│  React + TypeScript + Tailwind CSS          │
└──────────────────┬──────────────────────────┘
                   │ REST API (JSON)
┌──────────────────▼──────────────────────────┐
│              APPLICATION LAYER              │
│  Node.js + Express + TypeScript             │
│  - Controllers                              │
│  - Services                                 │
│  - Middleware (Auth, CORS, Rate Limit)      │
└──────────────────┬──────────────────────────┘
                   │
        ┌──────────┴──────────┐
        │                     │
┌───────▼────────┐   ┌────────▼────────┐
│  DATA LAYER    │   │  EXTERNAL APIs  │
│                │   │                 │
│  MariaDB       │   │  Anthropic      │
│  (Docker)      │   │  Claude API     │
│  Port 3307     │   │  Haiku 3.5      │
│                │   │                 │
│                │   │  Resend         │
│                │   │  Email API      │
│                │   │                 │
│                │   │  Google Drive   │
│                │   │  API            │
└────────────────┘   └─────────────────┘
```