import { expect, test, describe } from "vitest";
import { CreateMockApplicationFragmentProps, createMockApplicationViewFragment } from "@test/application.mocks";
import { render } from "@testing-library/react";
import { ViewApplication } from "./ViewApplication";
import { ApplicationStatusChoice } from "@gql/gql-types";

interface RenderProps extends CreateMockApplicationFragmentProps {
  children?: JSX.Element;
}
function customRender({ children, ...props }: RenderProps = {}): ReturnType<typeof render> {
  if (props.page == null) {
    props.page = "page3";
  }
  const application = createMockApplicationViewFragment(props);
  return render(<ViewApplication application={application}>{children ?? <div></div>}</ViewApplication>);
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
});

// TODO these can be moved to the ApplicationSectionList test file
describe("ApplicationSectionList", () => {
  test.todo("should render section infos correctly");
  test.todo("should render multiple application sections");
  test.todo("should render application sections with no reservation units");
  test.todo("should render sections with reservation units");
  test.todo("should render without applicationSections");
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
