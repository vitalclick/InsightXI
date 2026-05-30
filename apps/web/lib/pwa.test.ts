import {
  detectPlatform,
  isMobilePlatform,
  isStandaloneDisplay,
} from "./pwa";

describe("detectPlatform", () => {
  it("detects iOS", () => {
    const ua =
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15";
    expect(detectPlatform(ua)).toBe("ios");
  });

  it("detects Android", () => {
    const ua =
      "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/120";
    expect(detectPlatform(ua)).toBe("android");
  });

  it("falls back to desktop", () => {
    const ua = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120";
    expect(detectPlatform(ua)).toBe("desktop");
  });
});

describe("isMobilePlatform", () => {
  it("is true for ios/android, false for desktop", () => {
    expect(isMobilePlatform("ios")).toBe(true);
    expect(isMobilePlatform("android")).toBe(true);
    expect(isMobilePlatform("desktop")).toBe(false);
  });
});

describe("isStandaloneDisplay", () => {
  it("is true when the display-mode media query matches", () => {
    const mm = (q: string) => ({ matches: q.includes("standalone") });
    expect(isStandaloneDisplay(mm)).toBe(true);
  });

  it("is true via the iOS navigator.standalone flag", () => {
    const mm = () => ({ matches: false });
    expect(isStandaloneDisplay(mm, true)).toBe(true);
  });

  it("is false in a normal browser tab", () => {
    const mm = () => ({ matches: false });
    expect(isStandaloneDisplay(mm, false)).toBe(false);
  });
});
