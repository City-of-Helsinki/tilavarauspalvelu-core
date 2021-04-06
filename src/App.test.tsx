import React from "react";
import { render } from "@testing-library/react";
import App from "./App";

jest.mock("@axa-fr/react-oidc-context", () => ({
  useReactOidc: () => ({
    oidcUser: null,
  }),
}));

test("renders app", () => {
  const app = render(<App />);
  expect(app).toBeTruthy();
});
