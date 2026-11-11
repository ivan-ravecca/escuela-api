const test = require("node:test");
const assert = require("node:assert/strict");
const jwt = require("jsonwebtoken");

if (process.env.NODE_ENV !== "test" || process.env.DB_HOST !== "127.0.0.1"
  || process.env.DB_PORT !== "33317" || process.env.DB_NAME !== "escuela_test") {
  throw new Error("Run only against the isolated course test database and API");
}

const authorization = `Bearer ${jwt.sign({ sub: "test", email: "admin@example.test" }, "course-test-secret")}`;
const input = {
  id: "test-http-positions", title: "Test HTTP positions", term: "", openRegistration: "",
  info: "", curriculum: null, requirements: [], images: [], mostWanted: true,
  shortCourse: true, masterClass: false, sortOrder: 7, menuOrder: 0,
  menuPositions: { mostWanted: 3, shortCourse: 2, masterClass: 1 }, published: true,
  durationHours: null, modality: null, category: null, syllabusSummary: null,
  schedule: null, jobOpportunities: null,
};

async function request(path, method = "GET", body) {
  const response = await fetch(`http://127.0.0.1:31317${path}`, {
    method,
    headers: { Authorization: authorization, "Content-Type": "application/json" },
    ...(body && { body: JSON.stringify(body) }),
  });
  return { status: response.status, body: await response.json() };
}

test("API persists requested listing and per-category positions", async () => {
  const created = await request("/site-courses", "POST", input);
  assert.equal(created.status, 201);
  let list = (await request("/site-courses")).body.courses;
  const group = (key) => list.filter((course) => course[key])
    .sort((a, b) => a.menuPositions[key] - b.menuPositions[key]);
  assert.equal(list[6].id, input.id);
  assert.equal(group("mostWanted")[2].id, input.id);
  assert.equal(group("shortCourse")[1].id, input.id);
  const detail = await request(`/site-courses/${input.id}`);
  assert.equal(detail.body.course.sortOrder, 7);
  assert.equal(detail.body.course.menuPositions.shortCourse, 2);

  const changed = { ...input, sortOrder: 2, menuPositions: { ...input.menuPositions, mostWanted: 1, shortCourse: 3 } };
  assert.equal((await request(`/site-courses/${created.body.recordId}`, "PUT", changed)).status, 200);
  list = (await request("/site-courses")).body.courses;
  assert.equal(list[1].id, input.id);
  assert.equal(group("mostWanted")[0].id, input.id);
  assert.equal(group("shortCourse")[2].id, input.id);
  const invalid = { ...changed, menuPositions: { ...changed.menuPositions, shortCourse: 0 } };
  assert.equal((await request(`/site-courses/${created.body.recordId}`, "PUT", invalid)).status, 400);
});
