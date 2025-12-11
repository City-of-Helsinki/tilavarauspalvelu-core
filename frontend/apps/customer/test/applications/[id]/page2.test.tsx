import { createMockApplicationFragment } from "@test/application.mocks";
import type { CreateMockApplicationFragmentProps } from "@test/application.mocks";
import { createGraphQLMocks } from "@test/gql.mocks";
import { MockedGraphQLProvider } from "@test/test.react.utils";
import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, expect, test, describe } from "vitest";
import { getApplicationPath } from "@/modules/urls";
import Page2 from "@/pages/applications/[id]/page2";
import type { ApplicationPage2Query } from "@gql/gql-types";

const { mockedRouterPush, useRouter } = vi.hoisted(() => {
  const mockedRouterReplace = vi.fn();
  const mockedRouterPush = vi.fn();
  const query = {
    id: "1",
  };
  return {
    useRouter: () => ({
      replace: mockedRouterReplace,
      push: mockedRouterPush,
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
    expect(view.getByRole("button", { name: "common:next" }));
    expect(view.getByRole("link", { name: "breadcrumb:applications" })).toBeInTheDocument();
    expect(view.getByText("breadcrumb:application")).toBeInTheDocument();
    expect(view.getByRole("heading", { name: "applicationRound:notesWhenApplying" })).toBeInTheDocument();

    expect(
      view.getByLabelText("application:Page2.prioritySelectLabel", {
        selector: "button",
      })
    ).toBeInTheDocument();
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

  test("submit button is disabled without selection", async () => {
    const view = customRender({ page: "page1" });
    const nextButton = await view.findByRole("button", {
      name: "common:next",
    });
    expect(nextButton).toBeDisabled();
  });
});

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
    const select = view.getByTestId("time-selector__button--TUESDAY-14");
    await user.click(select);
    expect(view.getByText("application:validation.calendar.title"));
    expect(
      view.getByText(
        "application:validation.calendar.Suitable time range must be at least as long as the minimum duration"
      )
    );
    const validationErrors = view.getAllByText(/application:validation/);
    // title + message nothing else
    expect(validationErrors).toHaveLength(2);
  });

  test("error message should disappear if times are long enough", async () => {
    const user = userEvent.setup();
    const view = customRender({ page: "page1" });
    const select = view.getByTestId("time-selector__button--TUESDAY-14");
    await user.click(select);
    expect(view.queryAllByText(/application:validation/)).toHaveLength(2);
    const select2 = view.getByTestId("time-selector__button--TUESDAY-15");
    await user.click(select2);
    expect(view.queryAllByText(/application:validation/)).toHaveLength(0);
  });

  test("two disjointed time ranges are too short", async () => {
    const user = userEvent.setup();
    const view = customRender({ page: "page1" });
    const select = view.getByTestId("time-selector__button--TUESDAY-14");
    await user.click(select);
    const select2 = view.getByTestId("time-selector__button--TUESDAY-16");
    await user.click(select2);
    expect(view.queryAllByText(/application:validation/)).toHaveLength(2);
  });

  test("submit button should be disabled if there are errors", async () => {
    const user = userEvent.setup();
    const view = customRender({ page: "page1" });
    const select = view.getByTestId("time-selector__button--TUESDAY-14");
    await user.click(select);
    expect(view.queryAllByText(/application:validation/)).toHaveLength(2);
    expect(view.getByRole("button", { name: "common:next" })).toBeDisabled();
    const select2 = view.getByTestId("time-selector__button--TUESDAY-15");
    await user.click(select2);
    expect(view.queryAllByText(/application:validation/)).toHaveLength(0);
    expect(view.getByRole("button", { name: "common:next" })).not.toBeDisabled();
  });
});
