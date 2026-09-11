import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, test, expect, vi, beforeEach } from "vitest";
import { TrackingWrapper } from "./tracking";

const { useRouter, mockedOn } = vi.hoisted(() => {
  const mockedOn = vi.fn();
  return {
    useRouter: () => ({ events: { on: mockedOn, off: vi.fn() } }),
    mockedOn,
  };
});

vi.mock("next/router", () => ({
  useRouter,
}));

describe("TrackingWrapper", () => {
  beforeEach(() => {
    mockedOn.mockClear();
  });

  test("renders its children", () => {
    render(
      <TrackingWrapper matomoEnabled={false}>
        <div>child content</div>
      </TrackingWrapper>
    );
    expect(screen.getByText("child content")).toBeInTheDocument();
  });

  test("subscribes to routeChangeComplete when matomo is enabled", () => {
    render(
      <TrackingWrapper matomoEnabled>
        <div>child content</div>
      </TrackingWrapper>
    );
    expect(mockedOn).toHaveBeenCalledWith("routeChangeComplete", expect.any(Function));
  });

  test("does not subscribe when matomo is disabled", () => {
    render(
      <TrackingWrapper matomoEnabled={false}>
        <div>child content</div>
      </TrackingWrapper>
    );
    expect(mockedOn).not.toHaveBeenCalled();
  });
});
