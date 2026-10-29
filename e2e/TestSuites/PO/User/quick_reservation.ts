/** Port of PO/User/quick_reservation.robot */
import { Browser, currentPage, loc } from "../../../lib/Browser";
import { BuiltIn } from "../../../lib/BuiltIn";
import { Collections } from "../../../lib/Collections";
import { V, chain, expect, isTruthy, keywords, named, str } from "../../../lib/robot";
import type { RobotValue } from "../../../lib/robot";
import { String_ } from "../../../lib/String";
import { custom_keywords } from "../../Resources/custom_keywords";
import "../../Resources/parallel_test_data";
import "../../Resources/variables";
import "../../Resources/texts_FI";
import "../../Resources/serial_users";

export const quick_reservation = keywords("quick_reservation", {
  /** This keyword selects a random reservation slot from a list of available slots for quick reservations. */
  "Select The Free Slot From Quick Reservation": async () => {
    let all_free_quick_timeslots: RobotValue,
      total_slots: RobotValue,
      random_index: RobotValue,
      time_of_selected_slot: RobotValue,
      date_value: RobotValue,
      later_slots: number[];
    // DEVNOTE
    // This keyword/test cannot be run over midnight
    // Example -> Su 1.10.2023 klo 23:45-0:45, 1 t != La 30.9.2023 klo 23:45-su 1.10.20230:45, 1 t

    // The carousel can move when its slots change, wait until it shows slots and has stopped
    await Browser["Wait For Elements State"](
      '[class*="slide-visible"] >> [data-testid="quick-reservation__slot"] >> nth=0',
      "visible",
      named({ timeout: "10s", message: "No free available slots in quick reservation slots" })
    );
    await Browser["Wait For Elements State"](
      '[class*="slide-visible"] >> [data-testid="quick-reservation__slot"] >> nth=0',
      "stable",
      named({ timeout: "5s" })
    );

    // Get all available slots
    all_free_quick_timeslots = await Browser["Get Elements"](
      '[class*="slide-visible"] >> [data-testid="quick-reservation__slot"]'
    );

    // Get the total number of slots
    total_slots = await BuiltIn["Get Length"](all_free_quick_timeslots);
    await BuiltIn["Log"](`Total available slots: ${str(total_slots)}`);

    // Check if there are any available slots
    if (Number(total_slots) === 0) {
      await BuiltIn["Fail"]("No free available slots in quick reservation slots");
    }

    // Port: picks from the slots that start in 30 minutes or later, if there are any. A test can take minutes from
    // booking to cancelling, and a reservation that has started can't be cancelled (the Robot keyword can pick them).
    date_value = await quick_reservation["Get The Value From Date Input"]();
    const [day = 0, month = 0, year = 0] = str(date_value).split(".").map(Number);
    later_slots = [];
    for (const [index, slot] of all_free_quick_timeslots.entries()) {
      const [hours = 0, minutes = 0] = str(await Browser["Get Text"](slot))
        .split(":")
        .map(Number);
      if (new Date(year, month - 1, day, hours, minutes).getTime() >= Date.now() + 30 * 60_000) {
        later_slots.push(index);
      }
    }
    if (later_slots.length === 0) {
      later_slots = [...all_free_quick_timeslots.keys()];
    }

    // Pick one of them at random
    random_index = later_slots[Math.floor(Math.random() * later_slots.length)];
    await BuiltIn["Log"](`Randomly selected slot index: ${str(random_index)}`);

    // Get the time of the randomly selected slot
    time_of_selected_slot = await Browser["Get Text"](all_free_quick_timeslots[random_index]);
    await BuiltIn["Log"](`Selected slot time: ${str(time_of_selected_slot)}`);
    // Click the randomly selected slot
    await Browser["Focus"](all_free_quick_timeslots[random_index]);
    await Browser["Click"](all_free_quick_timeslots[random_index]);
    await Browser["Get Attribute"](
      all_free_quick_timeslots[random_index],
      "aria-pressed",
      "==",
      "true",
      named({ message: "The clicked slot was not selected" })
    );

    V.TIME_OF_QUICK_RESERVATION_FREE_SLOT = time_of_selected_slot;
  },

  /**
   * Clicks the submit button in quick reservation using JavaScript.
   * Polls for button to be enabled before clicking with dispatchEvent.
   */
  "User Clicks Submit Button In Quick Reservation": async () => {
    let button_selector: RobotValue, button_count: RobotValue, click_result: RobotValue;
    button_selector = 'id=quick-reservation >> [data-testid="quick-reservation__button--submit"]';

    // Wait for button to be visible
    await Browser["Wait For Elements State"](button_selector, "visible", named({ timeout: "10s" }));

    // Verify the button exists inside quick-reservation before clicking
    button_count = await Browser["Get Element Count"](button_selector);
    await BuiltIn["Should Be Equal As Integers"](
      button_count,
      "1",
      named({
        msg: `Expected exactly 1 submit button inside quick-reservation, found ${str(button_count)}. Button may have disappeared.`,
      })
    );
    await Browser["Scroll To Element"](button_selector);

    // Alternative: Basic Browser library click (commented out - less reliable with React re-renders)
    // Wait For Elements State  ${button_selector}  enabled  timeout=10s
    // Click  ${button_selector}

    // Use JavaScript to wait for button to be enabled and then click with dispatchEvent
    click_result = await Browser["Evaluate JavaScript"](button_selector, async (button: RobotValue) => {
      const maxWait = 10_000;
      const pollInterval = 200;
      let waited = 0;
      while (button.disabled && waited < maxWait) {
        // oxlint-disable-next-line promise/avoid-new, promise/param-names -- runs in the browser
        await new Promise((r) => setTimeout(r, pollInterval));
        waited += pollInterval;
      }
      if (button.disabled) {
        return { success: false, error: "Button still disabled after 10s" };
      }
      // oxlint-disable-next-line promise/avoid-new, promise/param-names -- runs in the browser
      await new Promise((r) => setTimeout(r, 300));
      const mouseDown = new MouseEvent("mousedown", { bubbles: true, cancelable: true, view: window });
      const mouseUp = new MouseEvent("mouseup", { bubbles: true, cancelable: true, view: window });
      const click = new MouseEvent("click", { bubbles: true, cancelable: true, view: window });
      button.dispatchEvent(mouseDown);
      button.dispatchEvent(mouseUp);
      button.dispatchEvent(click);
      return { success: true, waited: waited };
    });

    await BuiltIn["Log"](`Click result: ${str(click_result)}`);
    await BuiltIn["Should Be True"](
      isTruthy(click_result["success"]),
      named({ msg: `Failed to click button: ${str(click_result)}` })
    );

    // Wait for the target page element
    await Browser["Wait For Elements State"](
      '[data-testid="reservation__form--reservee-info"]',
      "visible",
      named({
        timeout: "20s",
        message: "ERROR: Reservee info form not visible on booking details page. Check screenshot.",
      })
    );
  },

  /** Returns a lock name for the open reservation unit page. */
  "Get Unit Lock Name": async () => {
    let url: RobotValue, unit_page: RobotValue;
    url = await Browser["Get Url"]();
    unit_page = await String_["Fetch From Left"](url, "?");
    return `QUICK_RESERVATION_${str(unit_page)}`;
  },

  /**
   * Reloads and waits for the unit's existing reservations (AffectingReservations query),
   * so that the free slots shown are up to date.
   */
  "Reload Reservation Unit Page And Wait For Reservations": async () => {
    let reservations_loaded: RobotValue;
    // Port: starts waiting once the reload has replaced the page, not before it. The page being replaced can start
    // the same query just before the reload, and that response (whose body never finishes) was taken for the new one.
    // The new page can't send its query before its scripts have loaded.
    await currentPage().reload({ waitUntil: "commit" });
    reservations_loaded = await quick_reservation["Start Waiting For Reservations Query"]();
    await quick_reservation["Wait For Reservations Query"](reservations_loaded);
    await Browser["Wait For Load State"]("load");
  },

  /** Starts waiting for the next AffectingReservations response. Call it before the action that opens the page. */
  "Start Waiting For Reservations Query": async () => {
    let started: RobotValue, reservations_loaded: RobotValue;
    started = Date.now();
    reservations_loaded = await Browser["Promise To"](
      Browser["Wait For Response"],
      named({
        matcher: (response: RobotValue) =>
          response.request().timing().startTime >= started &&
          response.url().includes("/graphql") &&
          (response.request().postData() || "").includes("AffectingReservations"),
        timeout: "20s",
      })
    );
    return reservations_loaded;
  },

  "Wait For Reservations Query": async (reservations_loaded: RobotValue) => {
    let response: RobotValue;
    response = await Browser["Wait For"](reservations_loaded);
    await BuiltIn["Should Be True"](
      response.ok,
      named({ msg: `Reservations query failed: HTTP ${str(response["status"])}` })
    );
    await BuiltIn["Should Be True"](
      !Object.hasOwn(response.body || {}, "errors"),
      named({ msg: "Reservations query returned errors" })
    );
  },

  "Select Duration": async (duration: RobotValue) => {
    let main_button: RobotValue, already_selected: RobotValue;
    await BuiltIn["Log"](duration);
    // Click  id=quick-reservation >> css=.Select-module_selectAndListContainer__vSJEv
    main_button = "id=quick-reservation__duration-main-button";
    // Clicking the selected duration would unselect it
    already_selected = await Browser["Get Element Count"](chain(main_button, `text="${str(duration)}"`));
    if (Number(already_selected) === 0) {
      await Browser["Click"](`id=quick-reservation >> ${str(main_button)}`);
      await Browser["Click"](`[role="option"] >> '${str(duration)}'`);
    }
    await Browser["Wait For Elements State"](
      chain(main_button, `text="${str(duration)}" >> nth=0`),
      "visible",
      named({ timeout: "5s" })
    );
    await custom_keywords["Close Select List If Open"](main_button);
  },

  "Click More Available Slots": async () => {
    await Browser["Click"]('[data-testid="quick-reservation-next-available-time"]');
  },

  /**
   * This keyword/test cannot be run overnight. For now varaamo cannot handle overnight reservations.
   * Example -> Su 1.10.2023 klo 23:45-0:45, 1 t != La 30.9.2023 klo 23:45-su 1.10.20230:45, 1 t
   */
  "Check The Quick Reservation Time": async (time_of_quick_reservation_slot: RobotValue) => {
    let reservationtime: RobotValue;
    await BuiltIn["Log"](V.TIME_OF_QUICK_RESERVATION_FREE_SLOT);
    await BuiltIn["Log"](V.TIME_OF_QUICK_RESERVATION);
    await BuiltIn["Log"](time_of_quick_reservation_slot);
    await Browser["Wait For Elements State"]('[data-testid="reservation__reservation-info-card__duration"]', "visible");
    reservationtime = await Browser["Get Text"]('[data-testid="reservation__reservation-info-card__duration"]');
    await BuiltIn["Should Be Equal"](time_of_quick_reservation_slot, reservationtime);
  },

  /**
   * Verifies the price in quick reservation info card.
   * Note: Price may not render immediately, causing mismatches like
   * "40,00 €" vs "0 - 40,00 €". Retries until the price is fully rendered.
   */
  "Check The Price Of Quick Reservation": async (price_with_text: RobotValue) => {
    await BuiltIn["Log"](`expected price string ${str(price_with_text)}`);
    await BuiltIn["Wait Until Keyword Succeeds"](
      V.CONTENT_WAIT_TIMEOUT,
      "250ms",
      quick_reservation["Info Card Price Should Be"],
      price_with_text
    );
  },

  "Info Card Price Should Be": async (price_with_text: RobotValue) => {
    let reservation_price: RobotValue, normalized_string: RobotValue;
    reservation_price = await Browser["Get Text"]('[data-testid="reservation__reservation-info-card__price"]');
    normalized_string = await custom_keywords["Remove Non-breaking Space"](reservation_price);
    await BuiltIn["Should Be Equal"](normalized_string, price_with_text);
  },

  "Get Booking Number": async () => {
    let reservation_number: RobotValue, BOOKING_NUM_ONLY: RobotValue;
    // The number is shown once the reservation has loaded
    reservation_number = await Browser["Get Text"](
      '[data-testid="reservation__reservation-info-card__reservationNumber"]',
      "matches",
      "^\\d+$"
    );
    BOOKING_NUM_ONLY = reservation_number;
    V.BOOKING_NUM_ONLY = BOOKING_NUM_ONLY;
    BOOKING_NUM_ONLY = V.BOOKING_NUM_ONLY;
    await BuiltIn["Log"](BOOKING_NUM_ONLY);
  },

  "Check Booking Number": async (booking_number: RobotValue) => {
    await BuiltIn["Log"](`booking_number: ${str(booking_number)}`);
    await expect(loc('[data-testid="reservation__reservation-info-card__reservationNumber"]')).toHaveText(
      str(booking_number),
      { useInnerText: true }
    );
  },

  /** Extracts and saves the numeric access code from the element. */
  "Get Access Code": async () => {
    let access_code_numbers: RobotValue, access_code_with_hash: RobotValue;
    // The access code is filled in after the card renders
    await expect(loc('[data-testid="reservation__reservation-info-card__accessType"]')).toContainText(/\d/);
    access_code_numbers = await custom_keywords["Get Number From Element Text"](
      '[data-testid="reservation__reservation-info-card__accessType"]'
    );
    // Add # at the end as it's required for access code entry in the system
    access_code_with_hash = `${str(access_code_numbers)}#`;
    V.ACCESS_CODE = access_code_with_hash;
    await BuiltIn["Log"](`Saved access code (with #): ${str(V.ACCESS_CODE)}`);
  },

  "Check Access Code": async (access_code: RobotValue) => {
    await custom_keywords["Check Number From Text Is Equal To"](
      '[data-testid="reservation__reservation-info-card__accessType"]',
      access_code
    );
  },

  "Confirms Date Picker Opens From Quick Reservation": async () => {
    await Browser["Wait For Elements State"]("id=quick-reservation__date", "visible");
    await Browser["Click"]('id=quick-reservation >> [aria-label="Valitse päivämäärä"]');

    // Ensures cancel button is visible
    await Browser["Wait For Elements State"]('button >> span:text-is("Sulje")', "visible");

    // Confirms the select button exists and closes the datepicker dialog window
    await Browser["Click"]('id=quick-reservation >> [data-testid="selectButton"]');

    // Verify the datepicker dialog is closed
    await Browser["Wait For Elements State"](
      'id=hds-date-picker >> [data-testid="selectButton"]',
      "hidden",
      named({ timeout: "5s" })
    );
  },

  /** Gets the current date value from the quick reservation date input field */
  "Get The Value From Date Input": async () => {
    let value: RobotValue;
    value = await Browser["Get Attribute"]("id=quick-reservation__date", "value");
    await BuiltIn["Log"](`The value of the quick reservation date is: ${str(value)}`);
    return value;
  },

  // MOBILE
  "Select Duration Mobile": async (duration: RobotValue) => {
    // Set to 1h
    await Browser["Click"]("id=mobile-quick-reservation-duration-toggle-button");
    // The clicks wait until the list's animation has ended
    await Browser["Click"](`[role="option"] >> '${str(duration)}'`);
  },

  /** Verifies that the specified time slot is not available in the list of free slots. */
  "Verify Time Slot Not Available": async (time_to_check: RobotValue) => {
    let elements: RobotValue, count: RobotValue, slot_texts: RobotValue, el: RobotValue, ok: RobotValue, t: RobotValue;
    await BuiltIn["Log"](`Verifying time slot not available: ${str(time_to_check)}`);

    await Browser["Wait For Elements State"]("id=quick-reservation__duration-main-button", "visible");
    // The free slots are rendered after the reservation form
    await expect(loc('[class*="slider-list"] >> [data-testid="quick-reservation__slot"]').first()).toBeVisible();
    // Port: instead of Robot's Sleep 2s. The page shows the free slots before its AffectingReservations query returns
    // and removes the booked ones, so wait until the slot is gone (the query can take over 10 s on the test env).
    await expect(
      loc(`[class*="slider-list"] >> [data-testid="quick-reservation__slot"]:text-is("${str(time_to_check)}")`),
      `Slot '${str(time_to_check)}' is still available`
    ).toHaveCount(0, { timeout: 20_000 });

    // 1 Collect all time slots
    elements = await Browser["Get Elements"]('[class*="slider-list"] >> [data-testid="quick-reservation__slot"]');

    // 2 Fail test if no slots are found
    count = await BuiltIn["Get Length"](elements);
    if (Number(count) === 0) {
      await BuiltIn["Fail"](`No slots found at all. Cannot verify exclusion of ${str(time_to_check)}`);
    }

    // 3 Lower Browser's default timeout
    await Browser["Set Browser Timeout"]("3s", named({ scope: "Test" }));

    // 4 Iterate, swallowing any Get Text failures and skipping blanks
    slot_texts = [];
    for (el of elements) {
      ok = await BuiltIn["Run Keyword And Return Status"](Browser["Get Text"], el);
      if (!isTruthy(ok)) {
        continue;
      }

      t = await Browser["Get Text"](el);
      if (str(t) === "") {
        continue;
      }

      await Collections["Append To List"](slot_texts, t);
      if (str(t) === str(time_to_check)) {
        break;
      }
    }

    // 5 Restore the original timeout
    await Browser["Set Browser Timeout"](V.BROWSER_TIMEOUT_GLOBAL, named({ scope: "Global" }));

    await BuiltIn["Log"](`Collected slots: ${str(slot_texts)}`);

    // 6 Final assertion
    await Collections["List Should Not Contain Value"](slot_texts, time_to_check);
    await BuiltIn["Log"](`Slot '${str(time_to_check)}' is not available, as expected.`);
  },
});
