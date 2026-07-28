import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const query = vi.fn();
  const release = vi.fn();
  const end = vi.fn();
  const getConnection = vi.fn().mockResolvedValue({ query, release });
  const pool = { getConnection, end, query };
  const createPool = vi.fn(() => pool);

  return {
    query,
    release,
    end,
    getConnection,
    pool,
    createPool,
  };
});

vi.mock("mysql2/promise", () => ({
  default: {
    createPool: mocks.createPool,
  },
}));

import { closePool, getPool, initializeDatabase } from "../../../database/connection";

describe("database connection", () => {
  beforeEach(async () => {
    mocks.createPool.mockImplementation(() => mocks.pool as any);
    mocks.getConnection.mockResolvedValue({
      query: mocks.query,
      release: mocks.release,
    } as any);
    await closePool();
    vi.clearAllMocks();
    mocks.createPool.mockImplementation(() => mocks.pool as any);
    mocks.getConnection.mockResolvedValue({
      query: mocks.query,
      release: mocks.release,
    } as any);
  });

  it("getPool creates a singleton pool", () => {
    const first = getPool();
    const second = getPool();

    expect(first).toBe(second);
    expect(mocks.createPool).toHaveBeenCalledTimes(1);
  });

  it("initializeDatabase creates table and releases connection", async () => {
    mocks.query.mockResolvedValueOnce([[]]);

    await initializeDatabase();

    expect(mocks.getConnection).toHaveBeenCalledTimes(1);
    expect(mocks.query).toHaveBeenCalledTimes(1);
    expect(mocks.release).toHaveBeenCalledTimes(1);
  });

  it("initializeDatabase releases connection on error", async () => {
    mocks.query.mockRejectedValueOnce(new Error("query failed"));

    await expect(initializeDatabase()).rejects.toThrow("query failed");
    expect(mocks.release).toHaveBeenCalledTimes(1);
  });

  it("closePool ends and resets pool", async () => {
    getPool();
    await closePool();

    expect(mocks.end).toHaveBeenCalledTimes(1);

    getPool();
    expect(mocks.createPool).toHaveBeenCalledTimes(2);
  });
});
