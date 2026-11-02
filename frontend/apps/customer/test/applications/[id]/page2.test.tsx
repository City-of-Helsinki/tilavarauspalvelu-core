import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, expect, test, describe, beforeEach } from "vitest";
import type { ApplicationPage2Query } from "@gql/gql-types";
import { getApplicationPath } from "@/modules/urls";
import Page2 from "@/pages/applications/[id]/page2";
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

type ApplicationPage2 = NonNullable<ApplicationPage2Query["application"]>;
function customRender(props: CreateMockApplicationFragmentProps = {}): ReturnType<typeof render> {
  if (props.page == null) {
    props.page = "page2";
  }
  const application: ApplicationPage2 = createMockApplicationFragment(props);
  const mocks = createGraphQLMocks();
  return render(
    <MockedGraphQLProvider mocks={mocks}>
      <Page2 application={application} />
    </MockedGraphQLProvider>
  );
}

describe("Application Page2", () => {
  test("should render page properly", () => {
    const view = customRender();
    expect(view.getByRole("heading", { name: "application:Page2.subHeading" })).toBeInTheDocument();
    expect(view.getByRole("button", { name: "common:next" })).toBeInTheDocument();
    expect(view.getByRole("link", { name: "breadcrumb:applications" })).toBeInTheDocument();
    expect(view.getByText("breadcrumb:application")).toBeInTheDocument();
    expect(view.getByRole("heading", { name: "applicationRound:notesWhenApplying" })).toBeInTheDocument();

    expect(view.getByRole("group", { name: "application:Page2.prioritySelectLabel" })).toBeInTheDocument();
    expect(
      view.getByLabelText("application:Page2.reservationUnitSelectLabel", {
        selector: "button",
      })
    ).toBeInTheDocument();
  });

  test("back button should go back to page1", async () => {
    const view = customRender();
    const prevBtn = await view.findByRole("button", {
      name: "common:prev",
    });
    await userEvent.click(prevBtn);
    expect(mockedRouterPush).toHaveBeenCalledWith(getApplicationPath(1, "page1"));
  });

  test("should send the form when clicking next", async () => {
    const view = customRender({ page: "page2" });
    const nextButton = await view.findByRole("button", {
      name: "common:next",
    });
    await userEvent.click(nextButton);
    expect(mockedRouterPush).toHaveBeenCalledWith(getApplicationPath(1, "page3"));
  });

  test("keeps next disabled until navigation completes", async () => {
    const nav = deferred<boolean>();
    mockedRouterPush.mockReturnValueOnce(nav.promise);
    const user = userEvent.setup();
    const view = customRender({ page: "page2" });
    const nextButton = await view.findByRole("button", { name: "common:next" });

    expect(nextButton).not.toBeDisabled();
    await user.click(nextButton);
    expect(mockedRouterPush).toHaveBeenCalledWith(getApplicationPath(1, "page3"));
    expect(nextButton).toBeDisabled();

    nav.resolve(true);
    await nav.promise;
  });

  test("submit button is disabled without selection", async () => {
    const view = customRender({ page: "page1" });
    const nextButton = await view.findByRole("button", {
      name: "common:next",
    });
    expect(nextButton).toBeDisabled();
  });
});

// Tuesday as the mocked t returns it: the translation key
const TUESDAY = "common:weekdayLongEnum.TUESDAY";

function tuesdayCell(view: ReturnType<typeof render>, begin: string) {
  return view.getByLabelText(new RegExp(`^${TUESDAY}, ${begin}–`));
}

// Selects the 15 minute cells from the given one down, so the whole range is 15 minutes * (steps + 1).
async function sweepDown(
  user: ReturnType<typeof userEvent.setup>,
  view: ReturnType<typeof render>,
  begin: string,
  steps: number
) {
  tuesdayCell(view, begin).focus();
  await user.keyboard(`{Shift>}${"{ArrowDown}".repeat(steps)}{/Shift}`);
}

// errors require form context so have to test on this level
describe("Application page2 validation errors", () => {
  test("no error messages by default", () => {
    const view = customRender({ page: "page1" });
    const validationErrors = view.queryAllByText(/application:validation/);
    expect(validationErrors).toHaveLength(0);
  });

  test("error message should be shown if times are not long enough", async () => {
    const user = userEvent.setup();
    const view = customRender({ page: "page1" });
    await user.click(tuesdayCell(view, "14:00"));
    expect(view.getByText("application:validation.calendar.title")).toBeInTheDocument();
    expect(
      view.getByText(
        "application:validation.calendar.Suitable time range must be at least as long as the minimum duration"
      )
    ).toBeInTheDocument();
    const validationErrors = view.getAllByText(/application:validation/);
    // title + message nothing else
    expect(validationErrors).toHaveLength(2);
  });

  test("error message should disappear if times are long enough", async () => {
    const user = userEvent.setup();
    const view = customRender({ page: "page1" });
    await user.click(tuesdayCell(view, "14:00"));
    expect(view.queryAllByText(/application:validation/)).toHaveLength(2);
    // 14:00 to 16:00 is two hours
    await sweepDown(user, view, "14:15", 6);
    expect(view.queryAllByText(/application:validation/)).toHaveLength(0);
  });

  test("two disjointed time ranges are too short", async () => {
    const user = userEvent.setup();
    const view = customRender({ page: "page1" });
    await user.click(tuesdayCell(view, "14:00"));
    await user.click(tuesdayCell(view, "16:00"));
    expect(view.queryAllByText(/application:validation/)).toHaveLength(2);
  });

  test("submit button should be disabled if there are errors", async () => {
    const user = userEvent.setup();
    const view = customRender({ page: "page1" });
    await user.click(tuesdayCell(view, "14:00"));
    expect(view.queryAllByText(/application:validation/)).toHaveLength(2);
    expect(view.getByRole("button", { name: "common:next" })).toBeDisabled();
    await sweepDown(user, view, "14:15", 6);
    expect(view.queryAllByText(/application:validation/)).toHaveLength(0);
    expect(view.getByRole("button", { name: "common:next" })).not.toBeDisabled();
  });
});

describe("Application page2 unsaved changes", () => {
  test("shows the page 1 summary for each section", async () => {
    const user = userEvent.setup();
    const view = customRender({ page: "page2", nSections: 2 });
    expect(view.getAllByRole("heading", { name: "applicationSectionSummary:title" })).toHaveLength(1);
    // only the first section is open by default. Open the others.
    const [, ...closedSections] = view.getAllByRole("button", { name: "foobar" });
    expect(closedSections).toHaveLength(1);
    for (const section of closedSections) {
      await user.click(section);
    }
    expect(view.getAllByRole("heading", { name: "applicationSectionSummary:title" })).toHaveLength(2);
  });

  // happy-dom has no window.confirm
  const confirm = vi.fn<(message?: string) => boolean>();
  beforeEach(() => {
    confirm.mockReset().mockReturnValue(false);
    window.confirm = confirm;
    mockedRouterPush.mockClear();
  });

  test("does not ask to confirm when there are no changes", async () => {
    const user = userEvent.setup();
    const view = customRender({ page: "page2" });
    await user.click(view.getByRole("button", { name: "common:prev" }));
    expect(confirm).not.toHaveBeenCalled();
    expect(mockedRouterPush).toHaveBeenCalledWith(getApplicationPath(1, "page1"));
    await expect(mockedRouterPush.mock.results[0]?.value).resolves.toBe(true);
  });

  test("asks to confirm before the user leaves with unsaved changes", async () => {
    const user = userEvent.setup();
    const view = customRender({ page: "page1" });
    await user.click(tuesdayCell(view, "14:00"));
    await user.click(view.getByRole("button", { name: "common:prev" }));
    expect(confirm).toHaveBeenCalledWith("common:unsavedChangesConfirm");
    expect(mockedRouterPush).toHaveBeenCalledWith(getApplicationPath(1, "page1"));
    // the user did not confirm, so the route change is cancelled
    await expect(mockedRouterPush.mock.results[0]?.value).resolves.toBe(false);
  });

  test("does not ask to confirm when the user saves with next", async () => {
    const user = userEvent.setup();
    const view = customRender({ page: "page1" });
    // 14:00 to 16:00 is two hours, so the form is valid
    await user.click(tuesdayCell(view, "14:00"));
    await sweepDown(user, view, "14:15", 6);
    await user.click(view.getByRole("button", { name: "common:next" }));
    expect(mockedRouterPush).toHaveBeenCalledWith(getApplicationPath(1, "page3"));
    expect(confirm).not.toHaveBeenCalled();
  });
});
