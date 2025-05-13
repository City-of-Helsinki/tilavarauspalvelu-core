import {
  ApplicationRoundStatusChoice,
  TermsType,
  type ApplicationPage4Query,
} from "@/gql/gql-types";
import Page3 from "@/pages/applications/[id]/page3";
import { MockedProvider } from "@apollo/client/testing";
import { render, within } from "@testing-library/react";
import { vi, expect, test, describe } from "vitest";
import {
  createMockApplicationFragment,
  CreateMockApplicationFragmentProps,
  type CreateGraphQLMocksReturn,
  createGraphQLApplicationIdMock,
  generateNameFragment,
} from "@/test/test.gql.utils";
import { base64encode } from "common/src/helpers";

const { useRouter } = vi.hoisted(() => {
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
type ApplicationPage4 = NonNullable<ApplicationPage4Query["application"]>;
function customRender(
  props: CreateMockApplicationFragmentProps = {}
): ReturnType<typeof render> {
  // TODO need a graphql mutation mock (but have to have separate error / success cases)
  if (props.page == null) {
    props.page = "page3";
  }
  const applicationRoundMock = {
    id: base64encode("ApplicationRoundNode:1"),
    sentDate: "2023-10-01T00:00:00Z",
    status: ApplicationRoundStatusChoice.Open,
    notesWhenApplyingFi: null,
    notesWhenApplyingEn: null,
    notesWhenApplyingSv: null,
    reservationPeriodBegin: "2023-10-01T00:00:00Z",
    reservationPeriodEnd: "2023-10-01T00:00:00Z",
    pk: 1,
    ...generateNameFragment("ApplicationRound"),
    termsOfUse: {
      id: base64encode("TermsOfUseNode:1"),
      pk: null,
      termsType: TermsType.RecurringTerms,
      // TODO
      nameFi: null,
      nameEn: null,
      nameSv: null,
      textFi: null,
      textEn: null,
      textSv: null,
    },
    reservationUnits: [] as const,
    /* TODO
      readonly reservationUnits: ReadonlyArray<{
        readonly minPersons: number | null;
        readonly maxPersons: number | null;
        readonly id: string;
        readonly pk: number | null;
        readonly nameFi: string | null;
        readonly nameEn: string | null;
        readonly nameSv: string | null;
        readonly unit: {
          readonly id: string;
          readonly pk: number | null;
          readonly nameFi: string | null;
          readonly nameSv: string | null;
          readonly nameEn: string | null;
        } | null;
        readonly images: ReadonlyArray<{
          readonly id: string;
          readonly imageUrl: string | null;
          readonly largeUrl: string | null;
          readonly mediumUrl: string | null;
          readonly smallUrl: string | null;
          readonly imageType: ImageType;
        }>;
      }>;
      */
  };
  const application: ApplicationPage4 = {
    ...createMockApplicationFragment(props),
    applicationRound: applicationRoundMock,
  };
  const mocks = createGraphQLMocks();
  return render(
    <MockedProvider mocks={mocks} addTypename={false}>
      <Page3 application={application} />
    </MockedProvider>
  );
}

//
describe("Application Page4", () => {
  test("smoke: should render page with initial data", async () => {
    // TODO all of this is common to all application funnel pages
    const view = customRender();
    expect(
      await view.findByRole("heading", { name: "application:Page3.heading" })
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
    expect(within(form).getByText("application:Page3.subHeading.basicInfo"));
    // TODO check that we have a single application section with the pick times calendar
  });
});
