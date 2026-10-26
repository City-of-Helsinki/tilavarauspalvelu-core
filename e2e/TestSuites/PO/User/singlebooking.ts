/** Port of PO/User/singlebooking.robot */
import { Browser } from "../../../lib/Browser";
import { BuiltIn } from "../../../lib/BuiltIn";
import { isTruthy, keywords, named, str } from "../../../lib/robot";
import type { RobotValue } from "../../../lib/robot";

export const singlebooking = keywords("singlebooking", {
  "Search Units By Name": async (search_text: RobotValue) => {
    await Browser["Type Text"]("input#search", search_text);
    // The search reads the typed text from the input
    await Browser["Get Property"]("input#search", "value", "==", search_text);
    //
    // Click  button[type="submit"]
    await Browser["Click"]('[data-testid="searchButton"]');
    await Browser["Wait For Load State"]("load", named({ timeout: "15s" }));
    // Check if actual results are found
    await Browser["Wait For Elements State"]('[data-testid="list-with-pagination__list--container"]', "visible");
  },

  "Click Searched Unit": async (searched_text: RobotValue) => {
    let searched_list_element: RobotValue;
    await BuiltIn["Sleep"]("2s");
    searched_list_element = await Browser["Get Text"]('[data-testid="list-with-pagination__list--container"] >> h2');
    await BuiltIn["Log"](searched_list_element);
    await BuiltIn["Should Be Equal"](searched_list_element, searched_text);
    await Browser["Click"](`h2 >> '${str(searched_text)}'`);
  },

  /**
   * Ensures the visibility of the search input by clicking the
   * "Advanced Search" toggle button if the search field is not already visible.
   */
  "Click Advanced Search If Search Not Visible": async () => {
    let search_visible: RobotValue;
    search_visible = await BuiltIn["Run Keyword And Return Status"](
      Browser["Wait For Elements State"],
      "id=search",
      "visible",
      named({ timeout: "5s" })
    );

    if (!isTruthy(search_visible)) {
      await BuiltIn["Log"]("Search input is not visible. Clicking advanced search");
      // Tää ei klikkaa oikeasti
      await Browser["Wait For Elements State"]('[data-testid="show-all__toggle-button"]', "visible");
      await Browser["Click"]('[data-testid="show-all__toggle-button"]');
      // Wait for animation
      await BuiltIn["Sleep"]("1s");
      await Browser["Wait For Elements State"]("id=search", "visible", named({ timeout: "5s" }));
    } else {
      await BuiltIn["Log"]("Search input is visible. No further action required.");
    }
  },
});
