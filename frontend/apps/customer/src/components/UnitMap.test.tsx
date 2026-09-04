import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { mapUrlPrefix } from "@/modules/const";
import { UnitMap } from "./UnitMap";

// The iframe is rendered into a detached container on purpose: happy-dom fetches the src of an
// iframe as soon as it is connected to the document, and tests must not make outbound requests.
function renderUnitMap(props: { tprekId: string; height?: string }): HTMLElement {
  const view = render(<UnitMap {...props} />, { container: document.createElement("div") });
  return view.getByTitle("reservationUnit:mapTitle");
}

describe("Component: UnitMap", () => {
  it("embeds the service map for the given tprek id in the active language", () => {
    expect(renderUnitMap({ tprekId: "12345" })).toHaveAttribute("src", `${mapUrlPrefix}fi/embed/unit/12345`);
  });

  it("uses the default height when none is given", () => {
    expect(renderUnitMap({ tprekId: "12345" }).style.height).toBe("480px");
  });

  it("uses the given height", () => {
    expect(renderUnitMap({ tprekId: "12345", height: "200px" }).style.height).toBe("200px");
  });
});
