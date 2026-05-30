export const INTELLIGENCE_QUEUE = "intelligence";

export const JOB_REFRESH_DATA = "refresh-data";
export const JOB_RETRAIN_MODELS = "retrain-models";

/** Parse a redis:// URL into bullmq connection options. */
export function parseRedisConnection(url: string): {
  host: string;
  port: number;
  password?: string;
} {
  try {
    const u = new URL(url);
    return {
      host: u.hostname || "localhost",
      port: u.port ? Number(u.port) : 6379,
      password: u.password || undefined,
    };
  } catch {
    return { host: "localhost", port: 6379 };
  }
}
