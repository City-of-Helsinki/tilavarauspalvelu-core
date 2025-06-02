import { type ApplicationPage3Query } from "@/gql/gql-types";
import Page3 from "@/pages/applications/[id]/page3";
import { render, within } from "@testing-library/react";
import { vi, expect, test, describe } from "vitest";
import { type CreateGraphQLMocksReturn } from "@test/test.gql.utils";
import {
  createMockApplicationFragment,
  type CreateMockApplicationFragmentProps,
  createGraphQLApplicationIdMock,
} from "@test/application.mocks";
import userEvent from "@testing-library/user-event";
import { getApplicationPath } from "@/modules/urls";
import { MockedGraphQLProvider } from "@test/test.react.utils";

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
type ApplicationPage3 = NonNullable<ApplicationPage3Query["application"]>;
function customRender(
  props: CreateMockApplicationFragmentProps = {}
): ReturnType<typeof render> {
  // TODO need a graphql mutation mock (but have to have separate error / success cases)
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

//
describe("Application Page3", () => {
  test("smoke: should render page with initial data", () => {
    // TODO all of this is common to all application funnel pages
    const view = customRender();
    expect(
      view.getByRole("heading", { name: "application:Page3.subHeading" })
    ).toBeInTheDocument();
    expect(view.getByRole("button", { name: "common:next" }));
    expect(
      view.getByRole("link", { name: "breadcrumb:applications" })
    ).toBeInTheDocument();
    expect(view.getByText("breadcrumb:application")).toBeInTheDocument();
    expect(
      view.getByRole("heading", { name: "applicationRound:notesWhenApplying" })
    ).toBeInTheDocument();

    const form = view.getByTestId("application__page3--form");
    expect(form).toBeInTheDocument();
    // TODO this doesn't match getByRole("heading")
    expect(
      within(form).getByText("application:Page3.sectionHeadings.basicInfo")
    );
    // TODO check that we have a single application section with the pick times calendar
  });

  test.todo("new application should not have type selected");
  test.todo("can't submit without selecting type");
  test.todo("type: individual form should render correctly");
  test.todo("type: organisation form should render correctly");
  test.todo("type: company form should render correctly");
  test.todo("toggling billing address should show/hide the section");
  test.todo("organisation should allow toggling VAT number");
  test.todo("individual should not have VAT number");
  test.todo("company should not allow toggling VAT number");

  test("should send the form when clicking next", async () => {
    const view = customRender({ page: "page3" });
    const nextButton = await view.findByRole("button", {
      name: "common:next",
    });
    await userEvent.click(nextButton);
    expect(mockedRouterPush).toHaveBeenCalledWith(
      getApplicationPath(1, "page4")
    );
  });
  test.todo("should fail to send if form is invalid");
});
