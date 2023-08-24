import React from "react";
import { render } from "@testing-library/react";
import { axe } from "jest-axe";
import RecommendedSlot from "./RecommendedSlot";

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
