import { createMockApplicationFragment } from "@test/application.mocks";
import type { CreateMockApplicationFragmentProps } from "@test/application.mocks";
import { createGraphQLMocks } from "@test/gql.mocks";
import { MockedGraphQLProvider } from "@test/test.react.utils";
import { render, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, expect, test, describe } from "vitest";
import { getApplicationPath } from "@/modules/urls";
import Page3 from "@/pages/applications/[id]/page3";
import type { ApplicationPage3Query } from "@gql/gql-types";

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
    expect(view.getByRole("button", { name: "common:next" }));
    expect(view.getByRole("link", { name: "breadcrumb:applications" })).toBeInTheDocument();
    expect(view.getByText("breadcrumb:application")).toBeInTheDocument();
    expect(view.getByRole("heading", { name: "applicationRound:notesWhenApplying" })).toBeInTheDocument();

    const form = view.getByTestId("application__page3--form");
    expect(form).toBeInTheDocument();
    expect(within(form).getByText("application:Page3.sectionHeadings.basicInfo"));
  });

  test("should send the form when clicking next", async () => {
    const view = customRender({ page: "page3" });
    const nextButton = await view.findByRole("button", {
      name: "common:next",
    });
    await userEvent.click(nextButton);
    expect(mockedRouterPush).toHaveBeenCalledWith(getApplicationPath(1, "page4"));
  });
});
