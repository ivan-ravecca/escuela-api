const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const jwt = require("jsonwebtoken");
const mysql = require("mysql2/promise");
if (process.env.NODE_ENV !== "test" || process.env.DB_HOST !== "127.0.0.1"
  || process.env.DB_PORT !== "33317" || process.env.DB_NAME !== "escuela_test") {
  throw new Error("Run only against the isolated course test database");
}
const { getAssistantCatalog } = require("../dist/services/siteCatalogCache");
const { toAssistantCourse } = require("../dist/services/assistantCourse");
const { leadCaptureSchema } = require("../dist/schemas");
const { closePool } = require("../dist/database/connection");

const base = "http://127.0.0.1:31317";
const token = jwt.sign(
  { sub: "test", email: "admin@example.test", name: "Test" },
  "course-test-secret",
);
const authorization = { Authorization: `Bearer ${token}` };
const input = {
  id: "zz-integration-test-course", title: "Curso de prueba", term: "Dos meses",
  openRegistration: "<p>Abierto</p><script>alert(1)</script>",
  info: "<p>Información</p><img src=x onerror=alert(1)>",
  curriculum: "<ul class=\"check-list\"><li>Contenido</li></ul>",
  requirements: ["Mayor de edad"], images: [],
  mostWanted: true, shortCourse: false, masterClass: false, sortOrder: 100, menuOrder: 100,
  menuPositions: { mostWanted: 1, shortCourse: 1, masterClass: 1 },
  published: true, durationHours: null, modality: null, category: null,
  syllabusSummary: null, schedule: null, jobOpportunities: null,
};

async function request(path, options = {}) {
  const response = await fetch(`${base}${path}`, { ...options, signal: AbortSignal.timeout(10000) });
  const body = await response.json();
  return { status: response.status, body };
}
const json = (method, body, authenticated = true) => ({
  method,
  headers: { "Content-Type": "application/json", ...(authenticated ? authorization : {}) },
  body: JSON.stringify(body),
});

test("catalog CRUD, HTML security, aliases, publication, upload and cache", async (t) => {
  let createdId;
  let uploadedFilename;
  t.after(async () => {
    if (createdId) {
      const connection = await mysql.createConnection({
        host: "127.0.0.1", port: 33317, user: "root",
        password: "temporary-test-only", database: "escuela_test",
      });
      try {
        await connection.query("DELETE FROM site_courses WHERE id = ? AND migration_key IS NULL AND title = ?", [createdId, input.title]);
      } finally {
        await connection.end();
      }
    }
    if (uploadedFilename) {
      const directory = process.env.SHOP_IMAGES_DIR;
      if (!directory || !path.isAbsolute(directory)) throw new Error("Missing test upload directory");
      fs.unlinkSync(path.join(directory, uploadedFilename));
    }
    await closePool();
  });
  const initial = await request("/site-courses");
  assert.equal(initial.status, 200);
  assert.equal(initial.body.courses.length, 18);
  assert.equal((await request("/site-courses/admin")).status, 401);
  assert.equal((await request("/site-courses", json("POST", input, false))).status, 401);

  const before = await getAssistantCatalog();
  const assistantCourse = toAssistantCourse(before[0], "https://example.test");
  assert.equal(assistantCourse.id, before[0].id);
  assert.equal(assistantCourse.url, `https://example.test${before[0].path}`);
  assert.equal(assistantCourse.duration_hours, undefined);
  assert.ok(assistantCourse.syllabus_summary);
  assert.equal(leadCaptureSchema.safeParse({
    name: "Test", phone: "099123456", email: "test@example.test",
    course_id: before[0].id, course_name: before[0].title,
  }).success, true);
  const created = await request("/site-courses", json("POST", input));
  assert.equal(created.status, 201);
  createdId = created.body.recordId;
  assert.doesNotMatch(created.body.openRegistration, /script|alert/);
  assert.doesNotMatch(created.body.info, /img|onerror/);
  assert.equal((await getAssistantCatalog()).length, before.length + 1);
  assert.equal((await request("/site-courses", json("POST", input))).status, 409);

  const edited = { ...input, id: "zz-integration-test-renamed" };
  const update = await request(`/site-courses/${created.body.recordId}`, json("PUT", edited));
  assert.equal(update.status, 200);
  const oldUrl = await request(`/site-courses/${input.id}`);
  assert.equal(oldUrl.status, 200);
  assert.equal(oldUrl.body.canonical, false);
  assert.equal(oldUrl.body.course.path, `/cursos/${edited.id}`);
  assert.ok((await getAssistantCatalog()).some((course) => course.id === edited.id));
  assert.equal((await request("/site-courses", json("POST", input))).status, 409);

  const hidden = await request(`/site-courses/${created.body.recordId}`, json("PUT", { ...edited, published: false }));
  assert.equal(hidden.status, 200);
  assert.equal((await request(`/site-courses/${edited.id}`)).status, 404);
  assert.ok(!(await getAssistantCatalog()).some((course) => course.id === edited.id));
  assert.equal((await request(`/courses/${created.body.recordId}`)).status, 404);
  assert.equal((await request(`/site-courses/${created.body.recordId}`, json("PUT", edited))).status, 200);
  assert.ok((await getAssistantCatalog()).some((course) => course.id === edited.id));

  const invalidImage = await request("/site-courses/images", {
    method: "POST", headers: { ...authorization, "Content-Type": "image/png" }, body: "not an image",
  });
  assert.equal(invalidImage.status, 400);
  const image = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/aN8AAAAASUVORK5CYII=",
    "base64",
  );
  const upload = await request("/site-courses/images", {
    method: "POST", headers: { ...authorization, "Content-Type": "image/png" }, body: image,
  });
  assert.equal(upload.status, 201);
  assert.match(upload.body.src, /^\/images\/shop\/[a-f0-9-]+\.png$/);
  uploadedFilename = path.basename(upload.body.src);
  assert.deepEqual(fs.readFileSync(path.join(process.env.SHOP_IMAGES_DIR, uploadedFilename)), image);
});
