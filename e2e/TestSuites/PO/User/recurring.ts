/** A resource file with top navigation keywords. */
import { Browser } from "../../../lib/Browser";
import { BuiltIn } from "../../../lib/BuiltIn";
import { keywords, named, str } from "../../../lib/robot";
import type { RobotValue } from "../../../lib/robot";
import { custom_keywords } from "../../Resources/custom_keywords";
import "../../Resources/variables";
import "../../Resources/texts_FI";
import "../../Resources/serial_users";

export const recurring = keywords("recurring", {
  "User Selects A Recurring Booking Round": async (name_of_the_recurring_reservation: RobotValue) => {
    let url_before: RobotValue;
    url_before = await Browser["Get Url"]();
    await custom_keywords["Find And Click Element In Card Element By Text"](
      '[data-testid="recurring-lander__application-round-container--active"] >> .card--default',
      '[data-testid="card__heading"]',
      name_of_the_recurring_reservation,
      'a[href*="/recurring/"]:not([href*="/criteria"])'
    );
    // The round's page opens, its units are waited for when they are selected
    await BuiltIn["Wait Until Keyword Succeeds"](
      "20s",
      "250ms",
      custom_keywords["Url Should Have Changed"],
      url_before,
      ""
    );
  },

  "User Selects The Units For Recurring Reservation": async (name_of_the_recurring_unit: RobotValue) => {
    // The units are loaded after the page opens
    await Browser["Wait For Elements State"](
      `[class*="Card__CardContent"] >> [data-testid="card__heading"] >> text="${str(name_of_the_recurring_unit)}" >> nth=0`,
      "visible",
      named({ timeout: "20s" })
    );
    await custom_keywords["Find And Click Element In Card Element By Text"](
      '[class*="Card__CardContent"]',
      '[data-testid="card__heading"]',
      name_of_the_recurring_unit,
      '[data-testid="recurring-card__button--toggle"]'
    );

    // For animation
    await BuiltIn["Sleep"]("300ms");
  },

  "User Checks The Count Of Selected Units": async (expected_text: RobotValue) => {
    await custom_keywords["Check Elements Text"]("id=reservationUnitCount", expected_text);
  },

  "User Clicks Continue Button": async () => {
    await Browser["Wait For Elements State"]("id=startApplicationButton", "visible");
    // Starting the application opens its first page
    await custom_keywords["Click And Wait For Page"]("id=startApplicationButton", "/page1");
  },
});
