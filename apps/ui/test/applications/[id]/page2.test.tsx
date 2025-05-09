import { type ApplicationPage2Query } from "@/gql/gql-types";
import Page2 from "@/pages/applications/[id]/page2";
import { MockedProvider } from "@apollo/client/testing";
import { render } from "@testing-library/react";
import { vi, expect, test, describe } from "vitest";
import {
  createGraphQLApplicationIdMock,
  type CreateGraphQLMocksReturn,
  createMockApplicationFragment,
  type CreateMockApplicationFragmentProps,
} from "@/test/test.gql.utils";
import userEvent from "@testing-library/user-event";
import { getApplicationPath } from "@/modules/urls";

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

function createGraphQLMocks(): CreateGraphQLMocksReturn {
  return createGraphQLApplicationIdMock();
}
type ApplicationPage2 = NonNullable<ApplicationPage2Query["application"]>;
function customRender(
  props: CreateMockApplicationFragmentProps = {}
): ReturnType<typeof render> {
  // TODO need a graphql mutation mock (but have to have separate error / success cases)
  if (props.page == null) {
    props.page = "page2";
  }
  const application: ApplicationPage2 = createMockApplicationFragment(props);
  const mocks = createGraphQLMocks();
  return render(
    <MockedProvider mocks={mocks} addTypename={false}>
      <Page2 application={application} />
    </MockedProvider>
  );
}

//
describe("Application Page2", () => {
  test("smoke: should render page properly", async () => {
    // TODO all of this is common to all application funnel pages
    const view = customRender();
    expect(
      await view.findByRole("heading", { name: "application:Page2.heading" })
    ).toBeInTheDocument();
    expect(view.getByRole("button", { name: "common:next" }));
    expect(
      view.getByRole("link", { name: "breadcrumb:applications" })
    ).toBeInTheDocument();
    expect(view.getByText("breadcrumb:application")).toBeInTheDocument();
    expect(
      view.getByRole("heading", { name: "applicationRound:notesWhenApplying" })
    ).toBeInTheDocument();

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
    // TODO check that we have a single application section with the pick times calendar
  });

  test("back button should go back to page1", async () => {
    const view = customRender();
    const prevBtn = await view.findByRole("button", {
      name: "common:prev",
    });
    await userEvent.click(prevBtn);
    expect(mockedRouterPush).toHaveBeenCalledWith(
      getApplicationPath(1, "page1")
    );
  });

  test("should send the form when clicking next", async () => {
    const view = customRender({ page: "page2" });
    const nextButton = await view.findByRole("button", {
      name: "common:next",
    });
    await userEvent.click(nextButton);
    expect(mockedRouterPush).toHaveBeenCalledWith(
      getApplicationPath(1, "page3")
    );
  });

  test("invalid form has submit disabled", async () => {
    const view = customRender({ page: "page1" });
    const nextButton = await view.findByRole("button", {
      name: "common:next",
    });
    expect(nextButton).toBeDisabled();
  });

  test.todo("too short time selection adds an error message after click");
});

describe("multiple application sections", () => {
  test.todo("should have independent time selects");
  test.todo("should have independent reservation unit selects");
  test.todo("on invalid section should disable submit");
  test.todo("selects are independent among multiple sections");
});
