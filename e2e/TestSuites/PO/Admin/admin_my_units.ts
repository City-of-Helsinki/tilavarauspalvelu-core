/** Port of PO/Admin/admin_my_units.robot */
import { Browser, currentPage, loc } from "../../../lib/Browser";
import { BuiltIn } from "../../../lib/BuiltIn";
import { expect, keywords } from "../../../lib/robot";
import type { RobotValue } from "../../../lib/robot";
import { custom_keywords } from "../../Resources/custom_keywords";
import "../../Resources/variables";
import "../../Resources/texts_FI";
import "../../Resources/serial_users";

export const admin_my_units = keywords("admin_my_units", {
  "Admin Searches Own Unit And Clicks It": async (units_location: RobotValue) => {
    await Browser["Type Text"]("id=search", units_location);
    // Find And Click Element With Text waits for the search results
    await custom_keywords["Find And Click Element With Text"]("td >> a", units_location);
    // The unit's page opens; its content is waited for by the keywords that use it
    await currentPage().waitForURL((url) => /\/my-units\/\d+/.test(url.pathname));
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

    // Verify button is visible and disabled (the unit's page may still be loading)
    await expect(loc(button_selector)).toBeVisible({ timeout: 15_000 });
    await expect(loc(button_selector)).toBeDisabled({ timeout: 2000 });

    await BuiltIn["Log"]("Button is properly disabled for VIEWER role");
  },

  "Admin Selects Unit From Reservation Units Dropdown": async (units_location: RobotValue) => {
    await Browser["Click"]('[aria-label*="Varausyksikkö"]');
    await custom_keywords["Find And Click Element With Text"]("li >> span", units_location);
    // An option picked within 200 ms of opening leaves the HDS Select list open
    await custom_keywords["Close Select List If Open"]('[aria-haspopup="listbox"][aria-label*="Varausyksikkö"]');
  },
});
