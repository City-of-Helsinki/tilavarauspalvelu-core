import * as React from "react";
import { render, screen } from "../../test/testUtils";
import StepperHz, { StepperHzProps } from "../StepperHz";

const defaultProps: StepperHzProps = {
  steps: [],
  active: null,
  bgColor: null,
};

const renderComponent = (props?: Partial<StepperHzProps>) =>
  render(<StepperHz {...defaultProps} {...props} />);

test("should render different states", () => {
  renderComponent({
    steps: [
      { label: "foo" },
      { label: "bar" },
      { label: "baz" },
      { label: "qax", error: true },
    ],
    active: 1,
  });
  const steps = screen.getAllByTestId("step");

  expect(steps[0].getAttribute("data-state")).toBe("done");
  expect(steps[1].getAttribute("data-state")).toBe("active");
  expect(steps[2].getAttribute("data-state")).toBe("inactive");
  expect(steps[3].getAttribute("data-state")).toBe("error");
  expect(screen.queryAllByTestId("step")).toHaveLength(4);
});
