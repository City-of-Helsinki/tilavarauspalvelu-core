import { type TermsOfUseFieldsFragment, TermsType } from "@/gql/gql-types";
import Page4 from "@/pages/applications/[id]/page4";
import { render, within } from "@testing-library/react";
import { vi, expect, test, describe } from "vitest";
import { createGraphQLMocks } from "@test/gql.mocks";
import {
  type CreateMockApplicationFragmentProps,
  createMockApplicationViewFragment,
} from "@test/application.mocks";
import { base64encode } from "common/src/helpers";
import userEvent from "@testing-library/user-event";
import { MockedGraphQLProvider } from "@test/test.react.utils";

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

function customRender(
  props: CreateMockApplicationFragmentProps = {}
): ReturnType<typeof render> {
  // TODO need a graphql mutation mock (but have to have separate error / success cases)
  if (props.page == null) {
    props.page = "page3";
  }
  const application = createMockApplicationViewFragment(props);
  const tos: TermsOfUseFieldsFragment = {
    id: base64encode("TermsOfUseNode:1"),
    pk: null,
    termsType: TermsType.GenericTerms,
    nameFi: null,
    nameEn: null,
    nameSv: null,
    textFi: null,
    textEn: null,
    textSv: null,
  };
  const mocks = createGraphQLMocks();
  return render(
    <MockedGraphQLProvider mocks={mocks}>
      <Page4 application={application} tos={tos} />
    </MockedGraphQLProvider>
  );
}

describe("Application Page4", () => {
  test("smoke", () => {
    // TODO some of this is common to all application funnel pages
    // we could just remove it (it's tested by the ApplicationFunnel tests)
    const view = customRender();
    expect(
      view.getByRole("heading", { name: "application:preview.subHeading" })
    ).toBeInTheDocument();
    expect(view.getByRole("button", { name: "common:submit" }));
    expect(
      view.getByRole("link", { name: "breadcrumb:applications" })
    ).toBeInTheDocument();
    expect(
      view.getByRole("heading", { name: "applicationRound:notesWhenApplying" })
    ).toBeInTheDocument();
    expect(view.getByText("Notes when applying FI")).toBeInTheDocument();
  });

  test.todo("notes when applying should be shown if present");
  test.todo("notes when applying should not be shown if empty or null");

  test("submit should be disabled unless terms of use are accepted", () => {
    const view = customRender();
    const submitButton = view.getByRole("button", { name: "common:submit" });
    expect(submitButton).toBeInTheDocument();
    expect(submitButton).toBeDisabled();
  });

  test("should allow submit if terms of use are accepted", async () => {
    const view = customRender();
    const user = userEvent.setup();
    const submitButton = view.getByRole("button", { name: "common:submit" });
    expect(submitButton).toBeInTheDocument();
    expect(submitButton).toBeDisabled();
    const checkbox = view.getByRole("checkbox", {
      name: "application:preview.userAcceptsGeneralTerms",
    });
    expect(checkbox).toBeInTheDocument();
    expect(checkbox).not.toBeChecked();
    await user.click(checkbox);
    expect(checkbox).toBeChecked();
    const checkbox2 = view.getByRole("checkbox", {
      name: "application:preview.userAcceptsSpecificTerms",
    });
    expect(checkbox2).toBeInTheDocument();
    expect(checkbox2).not.toBeChecked();
    await user.click(checkbox2);
    expect(checkbox2).toBeChecked();
    expect(submitButton).not.toBeDisabled();
    // TODO what happens when we click the submit button?
    // FIXME need to mock the sendApplication mutation
    // expect url push to getApplicationPath(resPk, "sent")
    // expect(mockedRouterPush).toHaveBeenCalledWith(getApplicationPath(1, "sent"));
  });
  test.todo("should show error if sendApplication fails and not url push");
});

// TODO have to move these back to page4 test because we refactored the ViewApplication
describe("Terms of Use", () => {
  test("should show terms of use", () => {
    const checkTerms = vi.fn();
    const view = customRender({});
    // Check that we have the terms of use checkboxes
    expect(
      view.getByText("reservationCalendar:heading.cancellationPaymentTerms")
    ).toBeInTheDocument();
    expect(
      view.getByText("reservationCalendar:heading.termsOfUse")
    ).toBeInTheDocument();
    const genericTermsContainer = view.getByTestId(
      "terms-box__container--general-terms"
    );
    expect(genericTermsContainer).toBeInTheDocument();
    const checkbox1 = within(genericTermsContainer).getByRole("checkbox", {
      name: "application:preview.userAcceptsGeneralTerms",
    });
    expect(checkbox1).toBeInTheDocument();
    expect(checkbox1).not.toBeChecked();

    const specificTermsContainer = view.getByTestId(
      "terms-box__container--service-specific-terms"
    );
    expect(specificTermsContainer).toBeInTheDocument();
    const checkbox2 = within(specificTermsContainer).getByRole("checkbox", {
      name: "application:preview.userAcceptsSpecificTerms",
    });
    expect(checkbox2).toBeInTheDocument();
    expect(checkbox2).not.toBeChecked();
    expect(checkTerms).not.toHaveBeenCalled();
    // TODO check that we have the terms of use text
  });

  test.todo("what happens if we have empty generic terms?");
  test.todo("what happens if application round has no terms of use?");
  test.todo("what happens if application round has empty terms of use?");
});
