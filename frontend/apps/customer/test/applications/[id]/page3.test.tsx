import { render, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, expect, test, describe, beforeEach } from "vitest";
import type { ApplicationPage3Query } from "@gql/gql-types";
import { getApplicationPath } from "@/modules/urls";
import Page3 from "@/pages/applications/[id]/page3";
import { createMockApplicationFragment } from "@test/application.mocks";
import type { CreateMockApplicationFragmentProps } from "@test/application.mocks";
import { createGraphQLMocks } from "@test/gql.mocks";
import { MockedGraphQLProvider } from "@test/test.react.utils";

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((_resolve, _reject) => {
    resolve = _resolve;
    reject = _reject;
  });
  return { promise, resolve, reject };
}

const { mockedRouterPush, useRouter } = vi.hoisted(() => {
  type Handler = (...args: unknown[]) => void;
  const handlers = new Map<string, Set<Handler>>();
  const events = {
    on: (type: string, fn: Handler) => handlers.set(type, (handlers.get(type) ?? new Set<Handler>()).add(fn)),
    off: (type: string, fn: Handler) => handlers.get(type)?.delete(fn),
  };
  const mockedRouterReplace = vi.fn();
  // Like Next.js, push emits routeChangeStart, so the unsaved changes warning runs.
  // A cancelled route change resolves to false here. Next.js rejects instead.
  const mockedRouterPush = vi.fn((url: string) => {
    try {
      for (const fn of handlers.get("routeChangeStart") ?? []) {
        fn(url);
      }
    } catch {
      return Promise.resolve(false);
    }
    return Promise.resolve(true);
  });
  const query = {
    id: "1",
  };
  return {
    useRouter: () => ({
      replace: mockedRouterReplace,
      push: mockedRouterPush,
      events,
      beforePopState: vi.fn(),
      query,
      asPath: "/applications/1/page1",
      pathname: "/applications/[id]/[page]",
    }),
    mockedRouterReplace,
    mockedRouterPush,
  };
});

const { useSearchParams } = vi.hoisted(() => {
  const mockedSearchParams = vi.fn();
  const params = new URLSearchParams();
  mockedSearchParams.mockReturnValue(params);
  return {
    useSearchParams: mockedSearchParams,
    mockedSearchParams,
  };
});

vi.mock("next/navigation", async (importOriginal) => {
  return {
    ...(await importOriginal()),
    useSearchParams,
  };
});

vi.mock("next/router", () => ({
  useRouter,
}));

type ApplicationPage3 = NonNullable<ApplicationPage3Query["application"]>;
function customRender(props: CreateMockApplicationFragmentProps = {}): ReturnType<typeof render> {
  if (props.page == null) {
    props.page = "page2";
  }
  const application: ApplicationPage3 = createMockApplicationFragment(props);
  const mocks = createGraphQLMocks();
  return render(
    <MockedGraphQLProvider mocks={mocks}>
      <Page3 application={application} />
    </MockedGraphQLProvider>
  );
}

describe("Application Page3", () => {
  test("smoke: should render page with initial data", () => {
    const view = customRender();
    expect(view.getByRole("heading", { name: "application:Page3.subHeading" })).toBeInTheDocument();
    expect(view.getByRole("button", { name: "common:next" })).toBeInTheDocument();
    expect(view.getByRole("link", { name: "breadcrumb:applications" })).toBeInTheDocument();
    expect(view.getByText("breadcrumb:application")).toBeInTheDocument();
    expect(view.getByRole("heading", { name: "applicationRound:notesWhenApplying" })).toBeInTheDocument();

    const form = view.getByTestId("application__page3--form");
    expect(form).toBeInTheDocument();
    expect(within(form).getByText("application:Page3.sectionHeadings.basicInfo")).toBeInTheDocument();
  });

  test("should send the form when clicking next", async () => {
    const view = customRender({ page: "page3" });
    const nextButton = await view.findByRole("button", {
      name: "common:next",
    });
    await userEvent.click(nextButton);
    expect(mockedRouterPush).toHaveBeenCalledWith(getApplicationPath(1, "page4"));
  });

  test("keeps next disabled until navigation completes", async () => {
    const nav = deferred<boolean>();
    mockedRouterPush.mockReturnValueOnce(nav.promise);
    const user = userEvent.setup();
    const view = customRender({ page: "page3" });
    const nextButton = await view.findByRole("button", { name: "common:next" });

    expect(nextButton).not.toBeDisabled();
    await user.click(nextButton);
    expect(mockedRouterPush).toHaveBeenCalledWith(getApplicationPath(1, "page4"));
    expect(nextButton).toBeDisabled();

    nav.resolve(true);
    await nav.promise;
  });
});

describe("Application page3 unsaved changes", () => {
  // happy-dom has no window.confirm
  const confirm = vi.fn<(message?: string) => boolean>();
  beforeEach(() => {
    confirm.mockReset().mockReturnValue(false);
    window.confirm = confirm;
    mockedRouterPush.mockClear();
  });

  test("does not ask to confirm when there are no changes", async () => {
    const user = userEvent.setup();
    const view = customRender({ page: "page3" });
    await user.click(view.getByRole("button", { name: "common:prev" }));
    expect(confirm).not.toHaveBeenCalled();
    expect(mockedRouterPush).toHaveBeenCalledWith(getApplicationPath(1, "page2"));
    await expect(mockedRouterPush.mock.results[0]?.value).resolves.toBe(true);
  });

  test("asks to confirm before the user leaves with unsaved changes", async () => {
    const user = userEvent.setup();
    const view = customRender({ page: "page3" });
    await user.type(view.getByRole("textbox", { name: /organisationName/ }), " changed");
    await user.click(view.getByRole("button", { name: "common:prev" }));
    expect(confirm).toHaveBeenCalledWith("common:unsavedChangesConfirm");
    // the user did not confirm, so the route change is cancelled
    await expect(mockedRouterPush.mock.results[0]?.value).resolves.toBe(false);
  });

  test("does not ask to confirm when the user saves with next", async () => {
    const user = userEvent.setup();
    const view = customRender({ page: "page3" });
    await user.type(view.getByRole("textbox", { name: /organisationName/ }), " changed");
    await user.click(view.getByRole("button", { name: "common:next" }));
    expect(mockedRouterPush).toHaveBeenCalledWith(getApplicationPath(1, "page4"));
    expect(confirm).not.toHaveBeenCalled();
  });
});
