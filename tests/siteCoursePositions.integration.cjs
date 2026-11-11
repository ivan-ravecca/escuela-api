const test = require("node:test");
const assert = require("node:assert/strict");

if (process.env.NODE_ENV !== "test" || process.env.DB_HOST !== "127.0.0.1"
  || process.env.DB_PORT !== "33317" || process.env.DB_NAME !== "escuela_test") {
  throw new Error("Run only against the isolated course test database");
}

const { SiteCourseRepository } = require("../dist/database/siteCourseRepository");
const { closePool } = require("../dist/database/connection");

const input = (number) => ({
  id: `test-course-${number}`, title: `Course ${number}`, term: "",
  openRegistration: "", info: "", curriculum: null, requirements: [], images: [],
  mostWanted: true, shortCourse: number <= 4, masterClass: false,
  sortOrder: number, menuOrder: number,
  menuPositions: { mostWanted: number, shortCourse: number, masterClass: 1 },
  published: true, durationHours: null, modality: null, category: null,
  syllabusSummary: null, schedule: null, jobOpportunities: null,
});

test("positions stay exact across listing and independent menu categories", async (t) => {
  t.after(() => closePool());
  for (let n = 1; n <= 10; n++) await SiteCourseRepository.create(input(n));

  const saved = await SiteCourseRepository.list(true);
  const target = saved.find((course) => course.id === "test-course-9");
  assert.ok(target);
  const move = {
    ...target, sortOrder: 7, shortCourse: true,
    menuPositions: { mostWanted: 3, shortCourse: 2, masterClass: 1 },
  };
  await SiteCourseRepository.update(target.recordId, move);
  let list = await SiteCourseRepository.list();
  assert.equal(list[6].id, target.id);
  const group = (key) => list.filter((course) => course[key])
    .sort((a, b) => a.menuPositions[key] - b.menuPositions[key]);
  assert.equal(group("mostWanted")[2].id, target.id);
  assert.equal(group("shortCourse")[1].id, target.id);
  assert.deepEqual(group("mostWanted").map((course) => course.menuPositions.mostWanted),
    Array.from({ length: 10 }, (_, index) => index + 1));

  await SiteCourseRepository.update(target.recordId, { ...move, published: false });
  list = await SiteCourseRepository.list();
  assert.equal(list.length, 9);
  assert.ok(!list.some((course) => course.id === target.id));
  assert.deepEqual(list.map((course) => course.sortOrder), Array.from({ length: 9 }, (_, index) => index + 1));
  await SiteCourseRepository.update(target.recordId, move);
  list = await SiteCourseRepository.list();
  assert.equal(list[6].id, target.id);
  assert.equal(group("mostWanted")[2].id, target.id);
  assert.equal(group("shortCourse")[1].id, target.id);

  await SiteCourseRepository.update(target.recordId, {
    ...move, sortOrder: 100, shortCourse: false,
    menuPositions: { ...move.menuPositions, mostWanted: 100 },
  });
  list = await SiteCourseRepository.list();
  assert.equal(list.at(-1).id, target.id);
  assert.equal(group("mostWanted").at(-1).id, target.id);
  assert.ok(!group("shortCourse").some((course) => course.id === target.id));
});
