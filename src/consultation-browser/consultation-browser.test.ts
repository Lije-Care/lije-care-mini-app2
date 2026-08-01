import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it, vi } from "vitest";
import { captureAndCleanHandoffCode } from "./url";

describe("external consultation entry", () => {
  const testDirectory = fileURLToPath(new URL(".", import.meta.url));
  it("captures the code once and immediately cleans it from the URL", () => {
    const replace = vi.fn();
    const code = captureAndCleanHandoffCode(
      "https://consult.example.test/consultation.html?code=opaque_123&source=tg",
      replace,
    );
    expect(code).toBe("opaque_123");
    expect(replace).toHaveBeenCalledWith(
      "/consultation.html?source=tg",
    );
  });

  it("captures a fragment code without sending it in the HTTP request URL", () => {
    const replace = vi.fn();
    const code = captureAndCleanHandoffCode(
      "https://consult.example.test/consultation.html#code=opaque_456",
      replace,
    );
    expect(code).toBe("opaque_456");
    expect(replace).toHaveBeenCalledWith("/consultation.html");
  });

  it("does not persist the handoff code", () => {
    const source = readFileSync(
      resolve(testDirectory, "index.tsx"),
      "utf8",
    );
    expect(source).not.toMatch(/localStorage|sessionStorage|document\.cookie/);
  });

  it("has no Telegram or media-acquisition dependency", () => {
    const browserDirectory = resolve(testDirectory);
    const files = [
      "index.tsx",
      "ConsultationRoot.tsx",
      "ConsultationPage.tsx",
      "HandoffRedeemer.tsx",
      "SessionLoader.tsx",
      "api.ts",
      "useConsultationLifecycle.ts",
    ];
    const source = files
      .map((file) => readFileSync(resolve(browserDirectory, file), "utf8"))
      .join("\n");
    expect(source).not.toMatch(/@telegram-apps|useLaunchParams|Telegram\.WebApp/);
    expect(source).not.toMatch(/getUserMedia\s*\(/);
  });

  it("gives the browser entry the only parent-side 100ms provider", () => {
    const entry = readFileSync(resolve(testDirectory, "index.tsx"), "utf8");
    const telegramRoot = readFileSync(
      resolve(testDirectory, "../components/Root.tsx"),
      "utf8",
    );
    expect(entry).toContain("<HMSRoomProvider>");
    expect(telegramRoot).not.toContain("HMSRoomProvider");
  });

  it("keeps audio consultations camera-free", () => {
    const page = readFileSync(resolve(testDirectory, "ConsultationPage.tsx"), "utf8");
    const lifecycle = readFileSync(
      resolve(testDirectory, "useConsultationLifecycle.ts"),
      "utf8",
    );
    expect(page).toContain('allowVideo={session.consultationType === "VIDEO"}');
    expect(page).toContain('session.consultationType === "VIDEO" &&');
    expect(lifecycle).toContain('session?.consultationType === "AUDIO" && videoEnabled');
    expect(lifecycle).toContain('session?.consultationType === "VIDEO"');
  });

  it("locks Join synchronously and refreshes bookings when Telegram returns", () => {
    const source = readFileSync(
      resolve(testDirectory, "../pages/Consultation/CallCenterView.tsx"),
      "utf8",
    );
    const handler = source.slice(
      source.indexOf("const prepareExternalConsultation"),
      source.indexOf("const professionals"),
    );
    expect(handler.indexOf("launchLockRef.current = true")).toBeGreaterThan(-1);
    expect(handler.indexOf("launchLockRef.current = true")).toBeLessThan(
      handler.indexOf("await api.post"),
    );
    expect(source).toContain(
      "document.addEventListener('visibilitychange', refreshOnReturn)",
    );
    expect(source).not.toContain("navigate(`/session-call");
  });
});
