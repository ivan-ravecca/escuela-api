import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createPool: vi.fn(),
  getConnection: vi.fn(),
  connectionQuery: vi.fn(),
  release: vi.fn(),
  end: vi.fn(),
}));

vi.mock("mysql2/promise", () => {
  return {
    default: {
      createPool: mocks.createPool,
    },
  };
});

import { closePool, getPool, initializeDatabase } from "../../../src/database/connection";

describe("database connection", () => {
  beforeEach(async () => {
    vi.clearAllMocks();

    mocks.connectionQuery.mockResolvedValue([{}]);
    mocks.release.mockImplementation(() => {});
    mocks.end.mockResolvedValue(undefined);

    mocks.getConnection.mockResolvedValue({
      query: mocks.connectionQuery,
      release: mocks.release,
    });

    mocks.createPool.mockReturnValue({
      getConnection: mocks.getConnection,
      end: mocks.end,
      query: vi.fn(),
    });

    await closePool();
  });

  it("getPool should create pool once and reuse it", () => {
    const poolA = getPool();
    const poolB = getPool();

    expect(poolA).toBe(poolB);
    expect(mocks.createPool).toHaveBeenCalledTimes(1);
  });

  it("initializeDatabase should run schema query and release connection", async () => {
    await initializeDatabase();

    expect(mocks.getConnection).toHaveBeenCalledOnce();
    expect(mocks.connectionQuery).toHaveBeenCalledOnce();
    expect(mocks.release).toHaveBeenCalledOnce();
  });

  it("initializeDatabase should release connection even when query fails", async () => {
    mocks.connectionQuery.mockRejectedValueOnce(new Error("query fail"));

    await expect(initializeDatabase()).rejects.toThrow("query fail");
    expect(mocks.release).toHaveBeenCalledOnce();
  });

  it("closePool should end active pool", async () => {
    mocks.end.mockClear();
    getPool();
    await closePool();
    expect(mocks.end).toHaveBeenCalledOnce();
  });
});
