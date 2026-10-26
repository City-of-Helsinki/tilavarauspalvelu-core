/** Port of PO/Admin/admin_my_units.robot */
import { Browser } from "../../../lib/Browser";
import { BuiltIn } from "../../../lib/BuiltIn";
import { keywords, named } from "../../../lib/robot";
import type { RobotValue } from "../../../lib/robot";
import { custom_keywords } from "../../Resources/custom_keywords";
import "../../Resources/variables";
import "../../Resources/texts_FI";
import "../../Resources/serial_users";

export const admin_my_units = keywords("admin_my_units", {
  "Admin Searches Own Unit And Clicks It": async (units_location: RobotValue) => {
    await BuiltIn["Sleep"]("1s");
    await Browser["Wait For Elements State"]("id=search", "visible");
    await Browser["Type Text"]("id=search", units_location);
    await BuiltIn["Sleep"]("3s"); // Wait for the search results to load
    await custom_keywords["Find And Click Element With Text"]("td >> a", units_location);
    await BuiltIn["Sleep"]("4s"); // long wait for spinner
  },

  "Admin Clicks Calendar Open In Own Units": async (unit_name: RobotValue) => {
    let result: RobotValue;
    // This locates the row in the calendar with the title="${unit_name}".
    // It then selects the 26th div within that row's container and clicks it.

    await BuiltIn["Log"]("If a wrong unit is opened, check that the DOM order has not changed");

    result = await Browser["Evaluate JavaScript"](
      null,
      (unitName: RobotValue) => {
        // Find the main element with the specified title
        const mainElement = document.querySelector(`div[title="${unitName}"]`);
        if (!mainElement) {
          return `Element with selector "div[title=${unitName}]" not found.`;
        }
        // Get the next sibling of the main element as the row container
        const rowContainer = mainElement.nextElementSibling;
        if (!rowContainer) {
          return "Row container (next sibling) not found";
        }
        // Locate the 26th div within the row container
        const targetDiv = rowContainer.querySelectorAll("div")[25];
        if (!targetDiv) {
          return "26th div not found within the row container";
        }
        // Click the target div
        targetDiv.click();
        return "Clicked the 26th div successfully";
      },
      unit_name
    );

    await BuiltIn["Log"](result);
  },

  "Admin Clicks Make Reservation": async () => {
    await Browser["Click"]('span:has-text("Tee varaus")');
  },

  "Admin Checks Make Reservation Button Is Disabled": async () => {
    let button_selector: RobotValue;
    button_selector = 'button:has-text("Tee varaus")';

    // Verify button is visible and disabled
    await Browser["Wait For Elements State"](button_selector, "visible", named({ timeout: "5s" }));
    await Browser["Wait For Elements State"](button_selector, "disabled", named({ timeout: "2s" }));

    await BuiltIn["Log"]("Button is properly disabled for VIEWER role");
  },

  "Admin Selects Unit From Reservation Units Dropdown": async (units_location: RobotValue) => {
    await Browser["Wait For Elements State"]('[aria-label*="Varausyksikkö"]', "visible");
    await Browser["Click"]('[aria-label*="Varausyksikkö"]');
    await BuiltIn["Sleep"]("1s");
    await custom_keywords["Find And Click Element With Text"]("li >> span", units_location);
    await BuiltIn["Sleep"]("1s");
  },
});
