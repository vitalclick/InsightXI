import { ArgumentsHost, BadRequestException, HttpException } from "@nestjs/common";
import { AllExceptionsFilter } from "./all-exceptions.filter";
import { ErrorReporter } from "./error-reporter";

function httpHost(): {
  host: ArgumentsHost;
  json: jest.Mock;
  status: jest.Mock;
} {
  const json = jest.fn();
  const status = jest.fn().mockReturnValue({ json });
  const host = {
    getType: () => "http",
    switchToHttp: () => ({
      getResponse: () => ({ status }),
      getRequest: () => ({ url: "/x", method: "GET" }),
    }),
  } as unknown as ArgumentsHost;
  return { host, json, status };
}

describe("AllExceptionsFilter", () => {
  it("maps an HttpException to its status and message", () => {
    const reporter = { report: jest.fn() } as unknown as ErrorReporter;
    const filter = new AllExceptionsFilter(reporter);
    const { host, status, json } = httpHost();
    filter.catch(new BadRequestException("bad input"), host);
    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 400, message: "bad input", path: "/x" }),
    );
    expect(reporter.report).not.toHaveBeenCalled(); // 4xx is not reported
  });

  it("hides internals and reports on a 500", () => {
    const reporter = { report: jest.fn() } as unknown as ErrorReporter;
    const filter = new AllExceptionsFilter(reporter);
    const { host, status, json } = httpHost();
    filter.catch(new Error("db password leaked in message"), host);
    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 500, message: "Internal server error" }),
    );
    expect(reporter.report).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 500 }),
    );
  });

  it("flattens validation message arrays", () => {
    const reporter = { report: jest.fn() } as unknown as ErrorReporter;
    const filter = new AllExceptionsFilter(reporter);
    const { host, json } = httpHost();
    filter.catch(
      new HttpException({ message: ["email must be an email", "password too short"] }, 422),
      host,
    );
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "email must be an email, password too short",
      }),
    );
  });
});

describe("ErrorReporter", () => {
  const ORIGINAL = { ...process.env };
  afterEach(() => {
    process.env = { ...ORIGINAL };
    jest.restoreAllMocks();
  });

  it("is a no-op when ERROR_WEBHOOK_URL is unset", () => {
    delete process.env.ERROR_WEBHOOK_URL;
    const fetchMock = jest.spyOn(globalThis, "fetch");
    const reporter = new ErrorReporter();
    expect(reporter.isConfigured()).toBe(false);
    reporter.report({ message: "x", statusCode: 500, timestamp: "t" });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("POSTs to the webhook when configured", () => {
    process.env.ERROR_WEBHOOK_URL = "https://hooks.example.com/x";
    const fetchMock = jest
      .spyOn(globalThis, "fetch")
      .mockResolvedValue({ ok: true } as Response);
    const reporter = new ErrorReporter();
    reporter.report({ message: "boom", statusCode: 500, timestamp: "t" });
    expect(fetchMock).toHaveBeenCalledWith(
      "https://hooks.example.com/x",
      expect.objectContaining({ method: "POST" }),
    );
  });
});
