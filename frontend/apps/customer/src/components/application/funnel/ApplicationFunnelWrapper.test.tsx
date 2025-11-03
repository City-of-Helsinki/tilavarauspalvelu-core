import { createMockApplicationFragment } from "@test/application.mocks";
import { render } from "@testing-library/react";
import { vi, expect, test, describe } from "vitest";
import { ApplicationFunnelWrapper } from ".";

const { useRouter } = vi.hoisted(() => {
  const mockedRouterReplace = vi.fn();
  const query = {
    id: "1",
  };
  return {
    useRouter: () => ({
      replace: mockedRouterReplace,
      query,
      asPath: "/applications/1/page1",
      pathname: "/applications/[id]/[page]",
    }),
    mockedRouterReplace,
  };
});

vi.mock("next/router", () => ({
  useRouter,
}));

describe("Stepper when starting application", () => {
  test.for([
    ["page1", "application:Page1.subHeading"],
    ["page2", "application:Page2.subHeading"],
    ["page3", "application:Page3.subHeading"],
    ["page4", "application:preview.subHeading"],
  ] as const)("application %s title", ([page, subtitle]) => {
    const application = createMockApplicationFragment({ page });
    const view = render(<ApplicationFunnelWrapper application={application} page={page} />);
    expect(view.getByRole("heading", { name: "application:heading" })).toBeInTheDocument();
    expect(view.getByText(subtitle)).toBeInTheDocument();
    expect(view.getByRole("heading", { name: subtitle })).toBeInTheDocument();
  });

  test.for([["page1"], ["page2"], ["page3"], ["page4"]] as const)("application %s breadcrumb", ([page]) => {
    const application = createMockApplicationFragment({ page });
    const view = render(<ApplicationFunnelWrapper application={application} page={page} />);
    expect(view.getByRole("link", { name: "breadcrumb:frontpage" })).toBeInTheDocument();
    expect(view.getByRole("link", { name: "breadcrumb:applications" })).toBeInTheDocument();
    // current not a link
    const current = view.getByText("breadcrumb:application");
    expect(current).toBeInTheDocument();
    expect(current).toHaveAttribute("aria-current", "true");
  });

  test.for([
    ["page1", "DRAFT"],
    ["page2", "DRAFT"],
    ["page3", "DRAFT"],
    ["page4", "RECEIVED"],
  ] as const)("application %s status = %s", ([page, status]) => {
    const application = createMockApplicationFragment({ page });
    const view = render(<ApplicationFunnelWrapper application={application} page={page} />);
    const statusLabel = `application:status.${status}`;
    expect(view.getByText(statusLabel)).toBeInTheDocument();
  });

  test.for([["page1"], ["page2"], ["page3"], ["page4"]] as const)("application %s notes when applying", ([page]) => {
    const application = createMockApplicationFragment({ page });
    const view = render(<ApplicationFunnelWrapper application={application} page={page} />);
    expect(
      view.getByRole("heading", {
        name: "applicationRound:notesWhenApplying",
      })
    ).toBeInTheDocument();
    expect(view.getByText("Notes when applying FI")).toBeInTheDocument();
  });

  test.for([["page1"], ["page2"], ["page3"], ["page4"]] as const)("application %s NO notes when applying", ([page]) => {
    const application = createMockApplicationFragment({
      page,
      notesWhenApplying: null,
    });
    const view = render(<ApplicationFunnelWrapper application={application} page={page} />);
    expect(view.queryByText("applicationRound:notesWhenApplying")).not.toBeInTheDocument();
  });
});
