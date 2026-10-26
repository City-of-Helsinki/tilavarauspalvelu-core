/** Port of PO/User/reservation_unit_booking_details.robot */
import { Browser } from "../../../lib/Browser";
import { BuiltIn } from "../../../lib/BuiltIn";
import { keywords } from "../../../lib/robot";
import type { RobotValue } from "../../../lib/robot";
import { custom_keywords } from "../../Resources/custom_keywords";
import "../../Resources/variables";
import "../../Resources/texts_FI";
import "../../Resources/serial_users";

export const reservation_unit_booking_details = keywords("reservation_unit_booking_details", {
  //
  // BOOKING DETAILS
  //
  "Type The Name Of The Booking": async (name_of_the_booking: RobotValue) => {
    await Browser["Type Text"]("id=reservation-form-field__name", name_of_the_booking);
  },

  "Select The Purpose Of The Booking": async (purpose: RobotValue) => {
    await Browser["Click"]("id=reservation-form-field__purpose-main-button");
    await BuiltIn["Sleep"]("1s"); // wait for dropdown to load
    await Browser["Wait For Elements State"]("id=reservation-form-field__purpose-option-2", "visible");
    await custom_keywords["Find And Click Element With Text"]("li", purpose);
  },

  "Select The Number Of Participants": async (number_of_persons: RobotValue) => {
    await Browser["Type Text"]("id=reservation-form-field__numPersons", number_of_persons);
  },

  "Type The Description Of The Booking": async (description_txt: RobotValue) => {
    await Browser["Type Text"]("id=reservation-form-field__description", description_txt);
  },

  "Click To Apply For A Free Booking": async () => {
    await Browser["Click"]("id=reservation-form-field__applyingForFreeOfCharge");
  },

  "Type Justification For Free Of Charge": async (reason: RobotValue) => {
    await Browser["Type Text"]("id=reservation-form-field__freeOfChargeReason", reason);
  },

  "Click And Select AgeGroup Button": async (age_group: RobotValue) => {
    await Browser["Wait For Elements State"]("id=reservation-form-field__ageGroup-main-button", "visible");
    await Browser["Click"]("id=reservation-form-field__ageGroup-main-button");
    await BuiltIn["Sleep"]("1s"); // wait for dropdown to load
    await custom_keywords["Find And Click Element With Text"]("li", age_group);
    await BuiltIn["Sleep"]("1s");
  },
});
