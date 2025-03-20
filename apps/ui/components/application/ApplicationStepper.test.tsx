import { vi, expect, test, describe } from "vitest";
import { PAGES_WITH_STEPPER, ApplicationStepper } from "./ApplicationStepper";
import { render } from "@testing-library/react";
import { createMockApplicationFragment } from "@/test/test.gql.utils";

const { useRouter } = vi.hoisted(() => {
  const mockedRouterReplace = vi.fn();
  const query = {
    id: "1",
  };
  return {
    useRouter: () => ({
      replace: mockedRouterReplace,
      query,
      asPath: "/applications/1/page1",
      pathname: "/applications/[id]/[page]",
    }),
    mockedRouterReplace,
  };
});

vi.mock("next/router", () => ({
  useRouter,
}));

function checkStepperStep(
  view: ReturnType<typeof render>,
  label: string,
  isDisabled: boolean,
  isCompleted?: boolean
) {
  const btn = view.getByRole("button", {
    name: RegExp(
      `application:navigation.${label}.+${isCompleted ? "Valmis\\.$" : ""}`
    ),
  });
  expect(btn).toBeInTheDocument();
  if (isDisabled) {
    expect(btn).toBeDisabled();
  } else {
    expect(btn).not.toBeDisabled();
  }
}

describe("Stepper when starting application", () => {
  test.for(
    PAGES_WITH_STEPPER.map((x) => ({ label: x, isDisabled: x !== "page1" }))
  )(
    "stepper step $label should render and be disabled = $isDisabled",
    ({ label, isDisabled }) => {
      const application = createMockApplicationFragment({ page: "page0" });
      const view = render(<ApplicationStepper application={application} />);
      checkStepperStep(view, label, isDisabled);
    }
  );
});

describe("Stepper when page 1 is valid", () => {
  test.for(
    PAGES_WITH_STEPPER.map((x) => ({
      label: x,
      isDisabled: x !== "page1" && x !== "page2",
    }))
  )(
    "stepper step $label should render and be disabled = $isDisabled",
    ({ label, isDisabled }) => {
      const application = createMockApplicationFragment({ page: "page1" });
      const view = render(<ApplicationStepper application={application} />);
      checkStepperStep(view, label, isDisabled);
    }
  );
});

describe("Stepper when page 2 is valid", () => {
  test.for(
    PAGES_WITH_STEPPER.map((x) => ({
      label: x,
      isDisabled: x === "preview",
    }))
  )(
    "stepper step $label should render and be disabled = $isDisabled",
    ({ label, isDisabled }) => {
      const application = createMockApplicationFragment({ page: "page2" });
      const view = render(<ApplicationStepper application={application} />);
      checkStepperStep(view, label, isDisabled);
    }
  );
});

describe("Stepper when page 3 is valid", () => {
  test.for(PAGES_WITH_STEPPER.map((x) => ({ label: x, isDisabled: false })))(
    "stepper step $label should render and be disabled = $isDisabled",
    ({ label, isDisabled }) => {
      const application = createMockApplicationFragment({ page: "page3" });
      const view = render(<ApplicationStepper application={application} />);
      checkStepperStep(view, label, isDisabled);
    }
  );
});

// TODO should check the style to be completed for all steps
describe("Stepper when application has been sent", () => {
  test.for(PAGES_WITH_STEPPER.map((x) => ({ label: x, isDisabled: false })))(
    "stepper step $label should render and be disabled = $isDisabled",
    ({ label, isDisabled }) => {
      const application = createMockApplicationFragment({
        page: "preview",
      });
      const view = render(<ApplicationStepper application={application} />);
      checkStepperStep(view, label, isDisabled, true);
    }
  );
});
