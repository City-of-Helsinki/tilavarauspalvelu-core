import React from "react";
import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import RecommendedSlot from "./RecommendedSlot";

jest.mock("react-i18next", () => ({
  useTranslation: () => {
    return {
      t: (str: string) => str,
      i18n: {
        changeLanguage: () => new Promise(() => {}),
      },
    };
  },
}));

test("RecommendedSlot", async () => {
  const { container } = render(
    <table>
      <RecommendedSlot
        id={1}
        start="2021-05-29"
        end="2022-05-29"
        weekday={0}
        biweekly
        timeStart="12:00"
        timeEnd="13:00"
        duration="01:00:00"
      />
    </table>
  );

  expect(await axe(container)).toHaveNoViolations();
});
