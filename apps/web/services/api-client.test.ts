import { api, apiGet, ApiError } from "./api-client";

describe("api-client", () => {
  const realFetch = globalThis.fetch;
  afterEach(() => {
    globalThis.fetch = realFetch;
  });

  it("returns parsed JSON on success and attaches a bearer token when given", async () => {
    let sentAuth: string | undefined;
    globalThis.fetch = (async (_url: string, init?: RequestInit) => {
      sentAuth = (init?.headers as Record<string, string>)?.Authorization;
      return { ok: true, status: 200, json: async () => ({ ok: true }) };
    }) as unknown as typeof fetch;

    const data = await apiGet<{ ok: boolean }>("/leagues", "tok-1");
    expect(data).toEqual({ ok: true });
    expect(sentAuth).toBe("Bearer tok-1");
  });

  it("throws an ApiError carrying the status code on failure", async () => {
    globalThis.fetch = (async () => ({
      ok: false,
      status: 403,
      statusText: "Forbidden",
      json: async () => ({}),
    })) as unknown as typeof fetch;

    await expect(api.trends("ars", "tok")).rejects.toBeInstanceOf(ApiError);
    await expect(api.trends("ars", "tok")).rejects.toMatchObject({ status: 403 });
  });

  it("builds league-filtered fixture URLs", async () => {
    const urls: string[] = [];
    globalThis.fetch = (async (url: string) => {
      urls.push(url);
      return { ok: true, status: 200, json: async () => [] };
    }) as unknown as typeof fetch;

    await api.fixtures("epl");
    await api.fixtures();
    expect(urls[0]).toContain("/matches/fixtures?league=epl");
    expect(urls[1]).toMatch(/\/matches\/fixtures$/);
  });
});
