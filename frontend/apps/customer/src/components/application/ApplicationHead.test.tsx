import { render } from "@testing-library/react";
import { expect, test, describe } from "vitest";
import { ApplicationStatusChoice } from "@gql/gql-types";
import { ApplicationHead } from "./ApplicationHead";

describe("ApplicationHead", () => {
  test("should render application head", () => {
    const view = render(<ApplicationHead status={ApplicationStatusChoice.Draft} title="title" />);
    const title = view.getByRole("heading", { name: "title" });
    expect(title).toBeInTheDocument();
    expect(view.queryByText("subTitle")).not.toBeInTheDocument();
    expect(view.queryByText(`application:status.DRAFT`)).toBeInTheDocument();
  });
});
