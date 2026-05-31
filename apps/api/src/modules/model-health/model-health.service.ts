import { Injectable, Logger } from "@nestjs/common";

export interface EvaluationReport {
  status: string;
  report: Record<string, unknown> | null;
}

export interface DriftReport {
  status: string;
  report: Record<string, unknown>;
}

/**
 * Surfaces the AI service's model-health endpoints (/evaluation, /drift) to the
 * web app through the API gateway, so the frontend never talks to the AI
 * service directly. Degrades gracefully when the AI service is unreachable.
 */
@Injectable()
export class ModelHealthService {
  private readonly logger = new Logger(ModelHealthService.name);
  private readonly baseUrl =
    process.env.AI_SERVICE_URL ?? "http://localhost:8000";
  private readonly internalToken = process.env.AI_SERVICE_TOKEN;

  private async call<T>(path: string, init?: RequestInit): Promise<T> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    try {
      const res = await fetch(`${this.baseUrl}${path}`, {
        ...init,
        headers: {
          "Content-Type": "application/json",
          ...(this.internalToken ? { "x-internal-key": this.internalToken } : {}),
          ...(init?.headers ?? {}),
        },
        signal: controller.signal,
      });
      if (!res.ok) throw new Error(`AI service responded ${res.status}`);
      return (await res.json()) as T;
    } finally {
      clearTimeout(timer);
    }
  }

  async evaluation(): Promise<EvaluationReport> {
    try {
      return await this.call<EvaluationReport>("/evaluation");
    } catch (err) {
      this.logger.warn(`evaluation unavailable: ${(err as Error).message}`);
      return { status: "unavailable", report: null };
    }
  }

  async drift(features: number[][]): Promise<DriftReport> {
    try {
      return await this.call<DriftReport>("/drift", {
        method: "POST",
        body: JSON.stringify({ features }),
      });
    } catch (err) {
      this.logger.warn(`drift unavailable: ${(err as Error).message}`);
      return { status: "unavailable", report: {} };
    }
  }
}
