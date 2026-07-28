import { describe, expect, it } from "vitest";
import {
  lifecycleReducer,
  safeLifecycleReducer,
  transitionLifecycle,
} from "./lifecycle";

describe("consultation lifecycle", () => {
  it("follows the successful authoritative lifecycle", () => {
    const events = ["VALIDATE", "VALID", "JOIN", "JOINED", "LEAVE", "LEFT"] as const;
    expect(events.reduce(lifecycleReducer, "IDLE")).toBe("DISCONNECTED");
  });

  it("lets the SDK reconnect without issuing a second join transition", () => {
    expect(transitionLifecycle("CONNECTED", "CONNECTION_LOST")).toBe("RECONNECTING");
    expect(transitionLifecycle("RECONNECTING", "RECONNECTED")).toBe("CONNECTED");
    expect(() => transitionLifecycle("RECONNECTING", "JOIN")).toThrow(/Invalid/);
  });

  it("rejects duplicate joins and repeated invalid leaves safely", () => {
    expect(() => transitionLifecycle("JOINING", "JOIN")).toThrow(/Invalid/);
    expect(safeLifecycleReducer("LEAVING", "LEAVE")).toBe("LEAVING");
    expect(safeLifecycleReducer("DISCONNECTED", "LEFT")).toBe("DISCONNECTED");
  });

  it("supports recoverable retry and terminal expiry", () => {
    expect(transitionLifecycle("JOINING", "FAIL_RECOVERABLE")).toBe("ERROR_RECOVERABLE");
    expect(transitionLifecycle("ERROR_RECOVERABLE", "RETRY")).toBe("VALIDATING_SESSION");
    expect(transitionLifecycle("DISCONNECTED", "FAIL_TERMINAL")).toBe("ERROR_TERMINAL");
  });
});
