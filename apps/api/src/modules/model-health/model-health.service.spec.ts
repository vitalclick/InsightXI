import { ModelHealthService } from "./model-health.service";

describe("ModelHealthService", () => {
  const realFetch = globalThis.fetch;
  afterEach(() => {
    globalThis.fetch = realFetch;
  });

  it("returns the AI evaluation report on success", async () => {
    globalThis.fetch = (async () => ({
      ok: true,
      json: async () => ({ status: "ok", report: { log_loss: 0.94, ece: 0.03 } }),
    })) as unknown as typeof fetch;

    const result = await new ModelHealthService().evaluation();
    expect(result.status).toBe("ok");
    expect(result.report).toMatchObject({ log_loss: 0.94 });
  });

  it("degrades gracefully when the AI service is unreachable", async () => {
    globalThis.fetch = (async () => {
      throw new Error("ECONNREFUSED");
    }) as unknown as typeof fetch;

    const evalResult = await new ModelHealthService().evaluation();
    expect(evalResult.status).toBe("unavailable");

    const driftResult = await new ModelHealthService().drift([[0, 0, 0, 0, 0]]);
    expect(driftResult.status).toBe("unavailable");
  });
});
