const test = require("node:test");
const assert = require("node:assert/strict");

Object.assign(process.env, {
  NODE_ENV: "test", JWT_SECRET: "test", GOOGLE_CLIENT_ID: "test",
  ALLOWED_DOMAIN: "example.test", SITE_URL: "http://localhost:5173",
  RESEND_API_KEY: "test", EMAIL_TO: "test@example.test", EMAIL_FROM: "test@example.test",
  HASH_SECRET: "test", ANTHROPIC_API_KEY: "test",
});

const calls = [];
let responses = [];
class FakeAnthropic {
  messages = { create: async (request) => {
    calls.push(request);
    return { content: [{ type: "text", text: responses.shift() ?? "Te recomiendo Curso de prueba" }] };
  } };
}
const sdkPath = require.resolve("@anthropic-ai/sdk");
require.cache[sdkPath] = { id: sdkPath, filename: sdkPath, loaded: true, exports: FakeAnthropic };
let emailResult = { data: { id: "test" }, error: null };
class FakeResend {
  emails = { send: async () => emailResult };
}
const resendPath = require.resolve("resend");
require.cache[resendPath] = { id: resendPath, filename: resendPath, loaded: true, exports: { Resend: FakeResend } };
const cache = require("../dist/services/siteCatalogCache");
const { AssistantController } = require("../dist/controllers/assistantController");
const { AssistantService } = require("../dist/services/assistantService");

function response() {
  return {
    statusCode: 0,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
  };
}

test("chat returns stale metadata and recommendations from the catalog", async () => {
  cache.getAssistantCatalog = async () => ({
    stale: true,
    courses: [{
      id: "curso", path: "/cursos/curso", title: "Curso de prueba",
      info: "", term: "", requirements: [], openRegistration: "", durationHours: null,
      modality: null, category: null, curriculum: null, schedule: null, jobOpportunities: null,
    }],
  });
  const res = response();
  await AssistantController.chat({
    body: { message: "Hola", conversation_history: [{ role: "assistant", content: "Bienvenida" }] },
  }, res);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.catalog_stale, true);
  assert.equal(res.body.recommended_courses[0].id, "curso");
  assert.equal(calls.length, 1);
  assert.equal(calls[0].messages.length, 1);
  assert.equal(calls[0].messages[0].role, "user");
  assert.match(calls[0].messages[0].content, /Curso de prueba/);
});

test("chat reports unavailable catalog without contacting AI", async () => {
  cache.getAssistantCatalog = async () => { throw new cache.CatalogUnavailableError(); };
  const res = response();
  const log = console.error;
  console.error = () => {};
  try {
    await AssistantController.chat({ body: { message: "Hola", conversation_history: [] } }, res);
  } finally {
    console.error = log;
  }
  assert.equal(res.statusCode, 503);
  assert.equal(res.body.code, "CATALOG_UNAVAILABLE");
  assert.equal(calls.length, 1);
});

test("interest capture reports delivery failures rather than success", async () => {
  const request = { body: {
    name: "Test", phone: "099123456", email: "test@example.test",
    course_id: "curso", course_name: "Curso",
  } };
  emailResult = { data: null, error: { message: "delivery failed" } };
  const res = response();
  const log = console.error;
  console.error = () => {};
  try {
    await AssistantController.captureInterest(request, res);
  } finally {
    console.error = log;
  }
  assert.equal(res.statusCode, 500);
  assert.notEqual(res.body.success, true);
  emailResult = { data: { id: "test" }, error: null };
  const success = response();
  await AssistantController.captureInterest(request, success);
  assert.equal(success.statusCode, 200);
  assert.equal(success.body.success, true);
});

test("welcome is brief and asks at most three questions", async () => {
  const welcome = await new AssistantService().generateWelcomeMessage();
  assert.ok((welcome.match(/\?/g) || []).length <= 3);
  assert.match(welcome, /qué te gustaría estudiar/i);
});

test("chat retries responses exceeding two follow-up questions", async () => {
  cache.getAssistantCatalog = async () => ({ stale: false, courses: [] });
  responses = [
    "¿Qué experiencia tenés? ¿Cuántas horas? ¿Qué modalidad?",
    "Podés conocer nuestros cursos. ¿Qué área te interesa?",
  ];
  const start = calls.length;
  const log = console.warn;
  console.warn = () => {};
  try {
    const result = await new AssistantService().chat("Quiero estudiar");
    assert.equal(result.response, "Podés conocer nuestros cursos. ¿Qué área te interesa?");
    assert.equal(calls.length - start, 2);
    assert.match(calls[start].system, /máximo 2 preguntas/);
    assert.match(calls[start].system, /sin exigir más respuestas/);
    assert.match(calls[start + 1].system, /respuesta anterior excedió el límite/);
  } finally {
    console.warn = log;
  }
});

test("chat accepts two follow-up questions and ignores question marks in URLs", async () => {
  cache.getAssistantCatalog = async () => ({ stale: false, courses: [] });
  responses = ["Mirá https://example.test/curso?a=1&b=2. ¿Qué área te interesa? ¿Tenés experiencia?"];
  const start = calls.length;
  const result = await new AssistantService().chat("Quiero estudiar");
  assert.equal(calls.length - start, 1);
  assert.match(result.response, /¿Tenés experiencia\?/);
});

test("chat rejects a second response exceeding the question limit", async () => {
  cache.getAssistantCatalog = async () => ({ stale: false, courses: [] });
  responses = ["¿Uno? ¿Dos? ¿Tres?", "¿Uno? ¿Dos? ¿Tres?"];
  const start = calls.length;
  const warn = console.warn;
  const error = console.error;
  console.warn = () => {};
  console.error = () => {};
  try {
    await assert.rejects(new AssistantService().chat("Hola"), /Failed to generate response/);
    assert.equal(calls.length - start, 2);
  } finally {
    console.warn = warn;
    console.error = error;
    responses = [];
  }
});
