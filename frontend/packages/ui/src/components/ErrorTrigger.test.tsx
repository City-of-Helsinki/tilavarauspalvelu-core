import { Component } from "react";
import type { ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import { ErrorTrigger, getErrorTriggerMode, triggerServerError } from "./ErrorTrigger";

const { mockQuery } = vi.hoisted(() => {
  const mockQuery: { current: Record<string, string> } = { current: {} };
  return { mockQuery };
});

vi.mock("next/router", () => ({
  useRouter: () => ({ isReady: true, query: mockQuery.current }),
}));

class TestErrorBoundary extends Component<{ children: ReactNode }, { message: string | null }> {
  state = { message: null };
  static getDerivedStateFromError(error: Error) {
    return { message: error.message };
  }
  render() {
    return this.state.message ?? this.props.children;
  }
}

describe("getErrorTriggerMode", () => {
  test("returns a known mode", () => {
    expect(getErrorTriggerMode({ throw: "render" })).toBe("render");
  });

  test("returns null for a missing or unknown mode", () => {
    expect(getErrorTriggerMode({})).toBeNull();
    expect(getErrorTriggerMode({ throw: "unknown" })).toBeNull();
    expect(getErrorTriggerMode({ throw: ["ssr", "render"] })).toBeNull();
  });
});

describe("triggerServerError", () => {
  // The test environment has a window, so remove it to act as the server
  function withoutWindow(fn: () => void) {
    const original = globalThis.window;
    // @ts-expect-error -- simulate the server
    delete globalThis.window;
    try {
      fn();
    } finally {
      globalThis.window = original;
    }
  }

  test("throws for ssr when enabled", () => {
    withoutWindow(() => {
      expect(() => triggerServerError(true, { query: { throw: "ssr" } })).toThrow("Test error from ?throw=ssr");
    });
  });

  test("does nothing when disabled", () => {
    withoutWindow(() => {
      expect(() => triggerServerError(false, { query: { throw: "ssr" } })).not.toThrow();
    });
  });

  test("does nothing on the error page", () => {
    withoutWindow(() => {
      expect(() => triggerServerError(true, { err: new Error("original"), query: { throw: "ssr" } })).not.toThrow();
    });
  });

  test("does nothing in the browser", () => {
    expect(() => triggerServerError(true, { query: { throw: "ssr" } })).not.toThrow();
  });
});

describe("ErrorTrigger", () => {
  test("throws during render for ?throw=render", async () => {
    mockQuery.current = { throw: "render" };
    vi.spyOn(console, "error").mockImplementation(() => {});
    render(
      <TestErrorBoundary>
        <ErrorTrigger enabled />
      </TestErrorBoundary>
    );
    expect(await screen.findByText("Test error from ?throw=render")).toBeInTheDocument();
  });

  test("does nothing when disabled", () => {
    mockQuery.current = { throw: "render" };
    const { container } = render(
      <TestErrorBoundary>
        <ErrorTrigger enabled={false} />
      </TestErrorBoundary>
    );
    expect(container).toBeEmptyDOMElement();
  });
});
