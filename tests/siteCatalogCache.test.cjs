const test = require("node:test");
const assert = require("node:assert/strict");

Object.assign(process.env, {
  NODE_ENV: "test", JWT_SECRET: "test", GOOGLE_CLIENT_ID: "test",
  ALLOWED_DOMAIN: "example.test", SITE_URL: "http://localhost:5173",
  RESEND_API_KEY: "test", EMAIL_TO: "test@example.test",
  EMAIL_FROM: "test@example.test", HASH_SECRET: "test",
});
const { createAssistantCatalogCache, CatalogUnavailableError } = require("../dist/services/siteCatalogCache");
const day = 24 * 60 * 60 * 1000;

test("catalog cache checks revisions, refreshes on changes and after 24 hours", async () => {
  let time = 0;
  let revision = "1";
  let revisions = 0;
  let loads = 0;
  const cache = createAssistantCatalogCache(async () => { revisions++; return revision; },
    async () => [{ id: String(++loads) }], () => time);
  assert.deepEqual(await cache(), { courses: [{ id: "1" }], stale: false });
  assert.deepEqual(await cache(), { courses: [{ id: "1" }], stale: false });
  assert.equal(revisions, 2);
  revision = "2";
  assert.deepEqual(await cache(), { courses: [{ id: "2" }], stale: false });
  time = day;
  assert.deepEqual(await cache(), { courses: [{ id: "3" }], stale: false });
});

test("uses a recent snapshot on revision or reload failure, then fails after 24 hours", async () => {
  let time = 0;
  let revision = "1";
  let failRevision = false;
  let failLoad = false;
  const cache = createAssistantCatalogCache(
    async () => { if (failRevision) throw new Error("revision failure"); return revision; },
    async () => { if (failLoad) throw new Error("load failure"); return [{ id: revision }]; },
    () => time,
  );
  const log = console.error;
  console.error = () => {};
  try {
    failRevision = true;
    await assert.rejects(cache(), CatalogUnavailableError);
    failRevision = false;
    await cache();
    failRevision = true;
    time = day;
    assert.deepEqual(await cache(), { courses: [{ id: "1" }], stale: true });
    time++;
    await assert.rejects(cache(), CatalogUnavailableError);
    time = 1;
    failRevision = false;
    failLoad = true;
    revision = "2";
    assert.deepEqual(await cache(), { courses: [{ id: "1" }], stale: true });
    failLoad = false;
    assert.deepEqual(await cache(), { courses: [{ id: "2" }], stale: false });
  } finally {
    console.error = log;
  }
});

test("coalesces concurrent loads and notices revisions that change during a load", async () => {
  let revision = "1";
  let loads = 0;
  let release;
  const gate = new Promise((resolve) => { release = resolve; });
  const cache = createAssistantCatalogCache(async () => revision, async () => {
    loads++;
    if (loads === 1) await gate;
    return [{ id: revision }];
  });
  const first = cache();
  const second = cache();
  await new Promise((resolve) => setImmediate(resolve));
  revision = "2";
  release();
  await Promise.all([first, second]);
  assert.equal(loads, 2);
  assert.deepEqual(await cache(), { courses: [{ id: "2" }], stale: false });
});

test("separate instances detect a shared revision change independently", async () => {
  let revision = "1";
  const readRevision = async () => revision;
  const readCourses = async () => [{ id: revision }];
  const first = createAssistantCatalogCache(readRevision, readCourses);
  const second = createAssistantCatalogCache(readRevision, readCourses);
  await Promise.all([first(), second()]);
  revision = "2";
  assert.equal((await first()).courses[0].id, "2");
  assert.equal((await second()).courses[0].id, "2");
});
