import * as React from "react";
import { render } from "../../../test/testUtils";
import Ticket from "../Ticket";

jest.mock("next/config", () => () => ({
  serverRuntimeConfig: {},
  publicRuntimeConfig: {},
}));

jest.mock("react-i18next", () => ({
  useTranslation: () => {
    return {
      t: (str: string) => str,
    };
  },
}));

jest.mock("next-i18next", () => ({
  i18n: { language: "fi", t: (str: string) => str },
}));

test("renders correctly", () => {
  const { asFragment } = render(
    <Ticket state="incomplete" title="Ticket title" />
  );
  expect(asFragment()).toMatchSnapshot();
});

test("renders correctly", () => {
  const { asFragment } = render(
    <Ticket state="incomplete" title="Ticket title" isFree />
  );
  expect(asFragment()).toMatchSnapshot();
});

test("renders correctly", () => {
  const { asFragment } = render(
    <Ticket
      state="complete"
      title="Backgstage huone"
      subtitle="Arabianrannan nuorisotalo"
      begin="2021-11-08T11:41:56.070Z"
      end="2021-11-08T13:41:56.070Z"
      isFree
      bgColor="var(--tilavaraus-gray)"
    />
  );
  expect(asFragment()).toMatchSnapshot();
});
