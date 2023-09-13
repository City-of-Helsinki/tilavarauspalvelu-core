import React from "react";
import { render, screen } from "@testing-library/react";
import ExampleCommonComponent from "./ExampleCommonComponent";

test("renders component", () => {
  render(<ExampleCommonComponent />);
  const divElement = screen.getByText(/Hello from/i);
  expect(divElement).toBeInTheDocument();
});
