import { renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { ROUTE_CHANGE_CANCELLED_MESSAGE } from "@/modules/const";
import { useUnsavedChangesWarning } from "./useUnsavedChangesWarning";

type Handler = (...args: unknown[]) => void;

const { router, emit, getPopStateHandler } = vi.hoisted(() => {
  const handlers = new Map<string, Set<Handler>>();
  let popStateHandler: (() => boolean) | null = null;
  const router = {
    events: {
      on: vi.fn((type: string, fn: Handler) => {
        const set = handlers.get(type) ?? new Set<Handler>();
        set.add(fn);
        handlers.set(type, set);
      }),
      off: vi.fn((type: string, fn: Handler) => {
        handlers.get(type)?.delete(fn);
      }),
    },
    beforePopState: vi.fn((fn: () => boolean) => {
      popStateHandler = fn;
    }),
  };
  const emit = (type: string, ...args: unknown[]) => {
    for (const fn of handlers.get(type) ?? []) {
      fn(...args);
    }
  };
  return { router, emit, getPopStateHandler: () => popStateHandler };
});

vi.mock("next/router", () => ({
  useRouter: () => router,
}));

function dispatchBeforeUnload(): Event {
  const event = new Event("beforeunload", { cancelable: true });
  window.dispatchEvent(event);
  return event;
}

describe("useUnsavedChangesWarning", () => {
  // happy-dom has no window.confirm
  const confirm = vi.fn<(message?: string) => boolean>();
  beforeEach(() => {
    confirm.mockReset().mockReturnValue(false);
    window.confirm = confirm;
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("does nothing without unsaved changes", () => {
    renderHook(() => useUnsavedChangesWarning(false));
    expect(() => emit("routeChangeStart", "/next")).not.toThrow();
    expect(dispatchBeforeUnload().defaultPrevented).toBe(false);
    expect(confirm).not.toHaveBeenCalled();
  });

  test("asks the browser to warn on reload and tab close", () => {
    renderHook(() => useUnsavedChangesWarning(true));
    expect(dispatchBeforeUnload().defaultPrevented).toBe(true);
  });

  test("cancels a route change if the user does not confirm", () => {
    renderHook(() => useUnsavedChangesWarning(true));
    expect(() => emit("routeChangeStart", "/next")).toThrow(ROUTE_CHANGE_CANCELLED_MESSAGE);
    expect(confirm).toHaveBeenCalledWith("common:unsavedChangesConfirm");
  });

  test("allows a route change if the user confirms", () => {
    confirm.mockReturnValue(true);
    renderHook(() => useUnsavedChangesWarning(true));
    expect(() => emit("routeChangeStart", "/next")).not.toThrow();
  });

  test("cancels a back navigation and puts the page back in the history", () => {
    const pushState = vi.spyOn(window.history, "pushState");
    renderHook(() => useUnsavedChangesWarning(true));
    expect(getPopStateHandler()?.()).toBe(false);
    expect(pushState).toHaveBeenCalledWith(window.history.state, "", window.location.href);
  });

  test("asks only once for a confirmed back navigation", () => {
    confirm.mockReturnValue(true);
    renderHook(() => useUnsavedChangesWarning(true));
    expect(getPopStateHandler()?.()).toBe(true);
    expect(() => emit("routeChangeStart", "/prev")).not.toThrow();
    expect(confirm).toHaveBeenCalledTimes(1);
  });

  test("asks again after a confirmed route change fails", () => {
    confirm.mockReturnValue(true);
    renderHook(() => useUnsavedChangesWarning(true));
    emit("routeChangeStart", "/next");
    emit("routeChangeError", new Error("load failed"), "/next");
    emit("routeChangeStart", "/next");
    expect(confirm).toHaveBeenCalledTimes(2);
  });

  test("removes the warning when the changes are gone", () => {
    const { rerender } = renderHook(({ dirty }) => useUnsavedChangesWarning(dirty), {
      initialProps: { dirty: true },
    });
    rerender({ dirty: false });
    expect(() => emit("routeChangeStart", "/next")).not.toThrow();
    expect(dispatchBeforeUnload().defaultPrevented).toBe(false);
    expect(getPopStateHandler()?.()).toBe(true);
    expect(confirm).not.toHaveBeenCalled();
  });
});
