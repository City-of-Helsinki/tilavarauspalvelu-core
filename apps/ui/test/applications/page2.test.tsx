import {
  type ApplicationPage2Query,
  OptionsDocument,
  type OptionsQuery,
  ReservationPurposeOrderingChoices,
  ReservationUnitTypeOrderingChoices,
  TimeSelectorFragment,
  UpdateApplicationDocument,
  type UpdateApplicationMutation,
} from "@/gql/gql-types";
import Page2 from "@/pages/applications/[id]/page2";
import { MockedProvider } from "@apollo/client/testing";
import { render, screen, within } from "@testing-library/react";
import { vi, expect, test, describe } from "vitest";
import {
  createMockApplicationFragment,
  CreateMockApplicationFragmentProps,
  createOptionQueryMock,
  generateNameFragment,
  mockAgeGroupOptions,
  mockDurationOptions,
  mockReservationPurposesOptions,
  type CreateGraphQLMocksReturn,
  createMockApplicationSection,
} from "@/test/test.gql.utils";
import userEvent from "@testing-library/user-event";
import { selectOption } from "../test.utils";
import { SEASONAL_SELECTED_PARAM_KEY } from "@/hooks/useReservationUnitList";
import { base64encode } from "common/src/helpers";

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

const { mockedSearchParams, useSearchParams } = vi.hoisted(() => {
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
type ApplicationPage2Sections = Pick<ApplicationPage2, "applicationSections">;
function customRender(
  props: CreateMockApplicationFragmentProps = {}
): ReturnType<typeof render> {
  // TODO need a graphql mutation mock (but have to have separate error / success cases)
  // const mocks = createGraphQLMocks();
  //const section =  createMockApplicationSection(props);
  if (props.page == null) {
    props.page = "page2";
  }
  const application: ApplicationPage2 = createMockApplicationFragment(props);
  const mocks = [] as const;
  return render(
    <MockedProvider mocks={mocks} addTypename={false}>
      <Page2 application={application} />
    </MockedProvider>
  );
}

//
describe("Application Page2", () => {
  test("smoke: should render page properly", async () => {
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

  test.skip("should send the form when clicking next", async () => {
    const view = customRender();
    const nextButton = await view.findByRole("button", {
      name: "common:next",
    });
    await userEvent.click(nextButton);
    expect(mockedRouterPush).toHaveBeenCalledWith("/applications/1/page3");
  });
  test.todo("should fail to send if form is invalid");
});
