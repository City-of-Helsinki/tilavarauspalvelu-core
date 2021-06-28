import React from "react";
import { render } from "@testing-library/react";
import { axe } from "jest-axe";
import App from "./App";

jest.mock("@axa-fr/react-oidc-context", () => ({
  useReactOidc: () => ({
    oidcUser: null,
  }),
}));

test("renders app", async () => {
  const app = render(<App />);
  expect(app).toBeTruthy();
  expect(await axe(app.container)).toHaveNoViolations();
});
