import { render } from "@testing-library/react";
import { expect, test, describe } from "vitest";
import { ApplicationStatusChoice } from "@gql/gql-types";
import { createMockApplicationViewFragment } from "@test/application.mocks";
import type { CreateMockApplicationFragmentProps } from "@test/application.mocks";
import { ViewApplication } from "./ViewApplication";

interface RenderProps extends CreateMockApplicationFragmentProps {
  children?: React.ReactElement;
}
function customRender({ children, ...props }: RenderProps = {}): ReturnType<typeof render> {
  if (props.page == null) {
    props.page = "page3";
  }
  const application = createMockApplicationViewFragment(props);
  return render(<ViewApplication application={application}>{children ?? <div />}</ViewApplication>);
}

describe("ViewApplication", () => {
  test("should have no children", () => {
    const view = customRender();
    expect(view.queryByText("Foobar")).toBeNull();
  });
  test("should have children", () => {
    const view = customRender({
      children: <div>Foobar</div>,
    });
    expect(view.queryByText("Foobar")).toBeInTheDocument();
  });
  test("should have basic info section", () => {
    const view = customRender();
    expect(
      view.getByRole("heading", {
        level: 2,
        name: "application:preview.basicInfoSubHeading",
      })
    ).toBeInTheDocument();
  });
  test("should have application sections", () => {
    const view = customRender();
    expect(
      view.getByRole("heading", {
        level: 3,
        name: "application:preview.applicationEvent.applicationInfo",
      })
    ).toBeInTheDocument();
  });
  test("should show unit name with applied spaces", () => {
    const view = customRender({ nReservationUnitOptions: 2 });
    expect(view.getByText("ReservationUnit 1 FI, Unit 1 FI")).toBeInTheDocument();
    expect(view.getByText("ReservationUnit 2 FI, Unit 2 FI")).toBeInTheDocument();
  });
});

describe("Processing Notification", () => {
  test.for([
    [ApplicationStatusChoice.Cancelled, true],
    [ApplicationStatusChoice.Draft, true],
    [ApplicationStatusChoice.Expired, true],
    [ApplicationStatusChoice.Handled, true],
    [ApplicationStatusChoice.InAllocation, true],
    [ApplicationStatusChoice.Received, true],
    [ApplicationStatusChoice.ResultsSent, false],
  ] as const)("should show if %s is not Results sent", ([status, isShown]) => {
    const view = customRender({ status });

    const title = view.queryByText("application:preview.notification.processing");
    const body = view.queryByText("application:preview.notification.body");
    if (isShown) {
      expect(title).toBeInTheDocument();
      expect(body).toBeInTheDocument();
    } else {
      expect(title).not.toBeInTheDocument();
      expect(body).not.toBeInTheDocument();
    }
  });
});
