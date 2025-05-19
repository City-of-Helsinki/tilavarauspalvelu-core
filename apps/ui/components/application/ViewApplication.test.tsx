import { expect, test, describe } from "vitest";
import {
  CreateMockApplicationFragmentProps,
  createMockApplicationViewFragment,
} from "@/test/test.gql.utils";
import { render } from "@testing-library/react";
import { ViewApplication } from "./ViewApplication";
import { ApplicationStatusChoice } from "@/gql/gql-types";

function customRender(
  props: CreateMockApplicationFragmentProps = {}
): ReturnType<typeof render> {
  // TODO need a graphql mutation mock (but have to have separate error / success cases)
  if (props.page == null) {
    props.page = "page3";
  }
  const application = createMockApplicationViewFragment(props);
  return render(
    <ViewApplication application={application}>
      <span>Foobar</span>
    </ViewApplication>
  );
}

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

    const title = view.queryByText(
      "application:preview.notification.processing"
    );
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
