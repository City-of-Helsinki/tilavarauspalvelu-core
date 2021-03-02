import React from "react";
import { fireEvent, render, waitFor } from "@testing-library/react";
import FilterControls from "./FilterControls";

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

test("Filter Controls", async () => {
  const filterConfig = [
    {
      title: "Group #1",
      filters: [
        {
          key: "id",
          value: 1,
          title: "Identifier",
        },
        {
          key: "status",
          value: "draft",
          title: "Status",
        },
      ],
    },
    {
      title: "Group #2",
      filters: [
        {
          key: "assignee",
          value: 13,
          title: "Assignee ID",
        },
      ],
    },
  ];

  const { getByTestId, getAllByTestId } = render(
    <FilterControls
      filters={[]}
      visible={true}
      applyFilters={() => {}}
      config={filterConfig}
    />
  );

  const resetButton = getByTestId("filter-controls__button--reset");
  const submitButton = getByTestId("filter-controls__button--submit");
  const groups = getAllByTestId("filter-controls__group");

  const group1Filters = groups[0].querySelectorAll(
    "[data-testid='filter-controls__filter--selector']"
  );
  const group2Filters = groups[1].querySelectorAll(
    "[data-testid='filter-controls__filter--selector']"
  );

  expect(resetButton).toBeDisabled();
  expect(submitButton).toBeDisabled();
  expect(group1Filters.length).toBe(2);
  expect(group2Filters.length).toBe(1);
  group1Filters.forEach((filter) => expect(filter).not.toBeVisible);
  group2Filters.forEach((filter) => expect(filter).not.toBeVisible);

  fireEvent.click(groups[0]);
  fireEvent.click(group1Filters[0]);

  await waitFor(() => {
    expect(resetButton).not.toBeDisabled();
    expect(submitButton).not.toBeDisabled();
    expect(group1Filters[0]).toBeChecked();
    expect(group1Filters[1]).not.toBeChecked();
  });

  group1Filters.forEach((filter) => expect(filter).toBeVisible);
  group2Filters.forEach((filter) => expect(filter).not.toBeVisible);

  fireEvent.click(groups[0]);
  fireEvent.click(groups[1]);

  await waitFor(() => {
    group1Filters.forEach((filter) => expect(filter).not.toBeVisible);
    group2Filters.forEach((filter) => {
      expect(filter).toBeVisible;
      expect(filter).not.toBeChecked;
    });
    expect(resetButton).not.toBeDisabled();
    expect(submitButton).not.toBeDisabled();
  });

  fireEvent.click(resetButton);

  await waitFor(() => {
    expect(resetButton).toBeDisabled();
    expect(submitButton).toBeDisabled();
  });

  fireEvent.click(group2Filters[0]);

  await waitFor(() => {
    expect(submitButton).not.toBeDisabled();
  });
});
