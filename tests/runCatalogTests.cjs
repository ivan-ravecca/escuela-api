const { spawn, spawnSync } = require("node:child_process");
const fs = require("node:fs");
const net = require("node:net");
const os = require("node:os");
const path = require("node:path");
const { setTimeout: delay } = require("node:timers/promises");

const root = path.resolve(__dirname, "..");
const password = "temporary-test-only";
let container;
let api;
let testProcess;
let directory;
let interrupted = false;

function command(program, args, options = {}) {
  const result = spawnSync(program, args, { encoding: "utf8", ...options });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`${program} ${args[0]} failed: ${result.stderr || `exit ${result.status}`}`);
  }
  return result.stdout;
}

function stopChild(child) {
  if (!child || child.exitCode !== null || child.signalCode !== null) return Promise.resolve();
  return new Promise((resolve) => {
    child.once("exit", resolve);
    child.kill("SIGTERM");
  });
}

async function checkApiPort() {
  await new Promise((resolve, reject) => {
    const probe = net.createServer();
    probe.once("error", (error) => reject(new Error(`Test API port 31317 is unavailable: ${error.message}`)));
    probe.listen(31317, "127.0.0.1", () => probe.close(resolve));
  });
}

async function waitForApi(child) {
  return new Promise((resolve, reject) => {
    let output = "";
    const timer = setTimeout(() => finish(new Error(`Test API startup timed out:\n${output}`)), 30000);
    function finish(error) {
      clearTimeout(timer);
      child.stdout.off("data", onData);
      child.stderr.off("data", onData);
      child.off("exit", onExit);
      child.off("error", onError);
      if (error) reject(error);
      else resolve();
    }
    function onData(data) {
      output += data.toString();
      if (output.includes("Server is running on http://localhost:31317")) finish();
    }
    function onExit(code) {
      finish(new Error(`Test API exited before startup (${code}):\n${output}`));
    }
    function onError(error) {
      finish(error);
    }
    child.stdout.on("data", onData);
    child.stderr.on("data", onData);
    child.once("exit", onExit);
    child.once("error", onError);
  });
}

async function main() {
  await checkApiPort();
  command("docker", ["info"], { stdio: "pipe" });
  command("docker", ["image", "inspect", "mariadb:11.2"], { stdio: "pipe" });
  directory = fs.mkdtempSync(path.join(os.tmpdir(), "escuela-catalog-test-"));
  container = command("docker", [
    "run", "-d", "--rm", "--pull=never", "-p", "127.0.0.1:33317:3306",
    "-e", `MARIADB_ROOT_PASSWORD=${password}`, "-e", "MARIADB_DATABASE=escuela_test",
    "mariadb:11.2",
  ]).trim();

  let ready = false;
  for (let attempt = 0; attempt < 60 && !interrupted; attempt++) {
    const probe = spawnSync("docker", [
      "exec", container, "mariadb", "-uroot", `-p${password}`, "escuela_test", "-e", "SELECT 1",
    ], { stdio: "ignore" });
    if (probe.error) throw probe.error;
    if (probe.status === 0) {
      ready = true;
      break;
    }
    await delay(1000);
  }
  if (!ready) throw new Error("The isolated MariaDB test database did not become ready.");

  for (const file of [
    "001_site_courses.sql", "002_site_courses_data.sql", "003_menu_order.sql", "004_course_positions.sql",
  ]) {
    command("docker", [
      "exec", "-i", container, "mariadb", "-uroot", `-p${password}`, "escuela_test",
    ], { input: fs.readFileSync(path.join(root, "migrations", file)) });
  }

  const env = {
    ...process.env,
    NODE_ENV: "test", DB_HOST: "127.0.0.1", DB_PORT: "33317", DB_NAME: "escuela_test",
    DB_USER: "root", DB_PASSWORD: password, PORT: "31317",
    JWT_SECRET: "course-test-secret", ALLOWED_DOMAIN: "example.test",
    GOOGLE_CLIENT_ID: "test.apps.googleusercontent.com", SITE_URL: "http://localhost:5173",
    RESEND_API_KEY: "test", EMAIL_TO: "test@example.test", EMAIL_FROM: "test@example.test",
    HASH_SECRET: "test", CSRF_SECRET: "isolated-test-only", SHOP_IMAGES_DIR: directory,
  };
  api = spawn(process.execPath, ["dist/app.js"], { cwd: root, env });
  await waitForApi(api);
  api.stdout.pipe(process.stdout);
  api.stderr.pipe(process.stderr);

  await new Promise((resolve, reject) => {
    testProcess = spawn(process.execPath, ["--test", "tests/siteCourses.integration.cjs"], {
      cwd: root, env, stdio: "inherit",
    });
    testProcess.once("error", reject);
    testProcess.once("exit", (code, signal) => {
      if (code === 0) resolve();
      else reject(new Error(`Catalog tests failed (${signal || `exit ${code}`}).`));
    });
  });
}

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.once(signal, () => {
    interrupted = true;
    if (testProcess) testProcess.kill(signal);
    if (api) api.kill(signal);
  });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}).finally(async () => {
  try {
    await stopChild(testProcess);
    await stopChild(api);
    if (container) command("docker", ["stop", container], { stdio: "pipe" });
    if (directory) fs.rmSync(directory, { recursive: true, force: true });
    if (interrupted) process.exitCode = 1;
  } catch (error) {
    console.error("Failed to clean up isolated test resources:", error);
    process.exitCode = 1;
  }
});
