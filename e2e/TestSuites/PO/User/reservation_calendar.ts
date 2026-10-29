/** Port of PO/User/reservation_calendar.robot */
import { Browser } from "../../../lib/Browser";
import { BuiltIn } from "../../../lib/BuiltIn";
import { V, isTruthy, keywords, named, str } from "../../../lib/robot";
import type { RobotValue } from "../../../lib/robot";
import { custom_keywords } from "../../Resources/custom_keywords";
import "../../Resources/variables";
import "../../Resources/texts_FI";
import "../../Resources/serial_users";

export const reservation_calendar = keywords("reservation_calendar", {
  "Select Duration Calendar": async (duration: string) => {
    // Click  [data-testid="reservation__input--duration"] >> id=duration-toggle-button
    await Browser["Click"]('[data-testid="calendar-controls__duration"] >> id=calendar-controls__duration-main-button');
    await Browser["Click"](`[role="option"] >> '${duration}'`);
    // An option picked within 200 ms of opening leaves the HDS Select list open
    await custom_keywords["Close Select List If Open"]("id=calendar-controls__duration-main-button");
  },

  "Click And Store Free Reservation Time": async () => {
    let time_slot_exists: RobotValue,
      available_slots: RobotValue,
      calendar_control_time_of_third_free_slot: RobotValue,
      is_current_time: RobotValue;
    await Browser["Click"]("id=calendar-controls__time-main-button");
    // The list is open when its options are shown
    await Browser["Wait For Elements State"](
      "id=calendar-controls__time-option-0",
      "visible",
      named({ timeout: "5s", message: "The time selection list did not open" })
    );

    // Check if enough time slots are available for the current day
    time_slot_exists = await BuiltIn["Run Keyword And Return Status"](
      Browser["Get Element"],
      "id=calendar-controls__time-option-2"
    );
    if (!isTruthy(time_slot_exists)) {
      available_slots = await Browser["Get Element Count"]('css=[id^="calendar-controls__time-option-"]');
      await BuiltIn["Fail"](
        `Not enough available time slots for the current day. Expected at least 3 slots, but found ${str(available_slots)}. Try selecting a different date or time range.`
      );
    }

    calendar_control_time_of_third_free_slot = await Browser["Get Text"]("id=calendar-controls__time-option-2");
    V.CALENDAR_CONTROL_TIME_OF_FREE_SLOT = calendar_control_time_of_third_free_slot;
    // Clicking the current time would unselect it and keep the continue button disabled
    is_current_time = await Browser["Get Element Count"](
      `id=calendar-controls__time-main-button >> text="${str(V.CALENDAR_CONTROL_TIME_OF_FREE_SLOT)}"`
    );
    if (Number(is_current_time) > 0) {
      await BuiltIn["Log"](
        `${str(V.CALENDAR_CONTROL_TIME_OF_FREE_SLOT)} is the current time, changing to a different time`
      );
      await reservation_calendar["Changing Time Again"]();
    } else {
      await BuiltIn["Log"](`Attempting to select time: ${str(V.CALENDAR_CONTROL_TIME_OF_FREE_SLOT)}`);
      await Browser["Click"]("id=calendar-controls__time-option-2");
    }
    await Browser["Wait For Elements State"](
      `id=calendar-controls__time-main-button >> text="${str(V.CALENDAR_CONTROL_TIME_OF_FREE_SLOT)}" >> nth=0`,
      "visible",
      named({ timeout: "5s" })
    );
    await custom_keywords["Close Select List If Open"]("id=calendar-controls__time-main-button");
  },

  "Changing Time Again": async () => {
    let time_slot_exists: RobotValue,
      available_slots: RobotValue,
      calendar_control_time_of_fourth_free_slot: RobotValue;
    // Check if the 4th time slot is available
    time_slot_exists = await BuiltIn["Run Keyword And Return Status"](
      Browser["Get Element"],
      "id=calendar-controls__time-option-3"
    );
    if (!isTruthy(time_slot_exists)) {
      available_slots = await Browser["Get Element Count"]('css=[id^="calendar-controls__time-option-"]');
      await BuiltIn["Fail"](
        `Not enough available time slots to change time. Expected at least 4 slots, but found ${str(available_slots)}. Try selecting a different date or time range.`
      );
    }

    calendar_control_time_of_fourth_free_slot = await Browser["Get Text"]("id=calendar-controls__time-option-3");
    V.CALENDAR_CONTROL_TIME_OF_FREE_SLOT = calendar_control_time_of_fourth_free_slot;
    await BuiltIn["Log"](`Selecting alternative time: ${str(V.CALENDAR_CONTROL_TIME_OF_FREE_SLOT)}`);
    await Browser["Click"]("id=calendar-controls__time-option-3");
  },

  "Get Current Date From Datepicker": async () => {
    let value: RobotValue;
    // ${value}=  Browser.Get Attribute  id=reservationDialog.date  value
    value = await Browser["Get Attribute"]("id=controlled-date-input__date", "value");
    await BuiltIn["Log"](`The value of the quick reservation date is: ${str(value)}`);
    return value;
  },

  "Click Continue Button": async () => {
    await Browser["Click"]('[data-testid="reservation__button--continue"]');
    // Continuing opens the terms step of the edit
    await Browser["Wait For Elements State"](
      '[for="cancellation-and-payment-terms-terms-accepted"]',
      "visible",
      named({ timeout: "15s" })
    );
  },

  "User Click Reservation Calendar Toggle Button": async () => {
    // The next click waits until the calendar's animation has ended
    await Browser["Click"]('[data-testid="calendar-controls__toggle-button"]');
  },
});
