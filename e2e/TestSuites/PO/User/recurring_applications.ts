/** A resource file with top navigation keywords. */
import { Browser } from "../../../lib/Browser";
import { keywords } from "../../../lib/robot";
import type { RobotValue } from "../../../lib/robot";
import { custom_keywords } from "../../Resources/custom_keywords";
import "../../Resources/variables";
import "../../Resources/texts_FI";
import "../../Resources/serial_users";

export const recurring_applications = keywords("recurring_applications", {
  "User Fills The Recurring Reservation Name": async (name_of_the_recurring_reservation: RobotValue) => {
    await Browser["Type Text"]("id=applicationSections.0.name", name_of_the_recurring_reservation);
  },

  "User Fills The Number Of People In The Recurring Reservation": async (number_of_people: RobotValue) => {
    await Browser["Type Text"]("id=applicationSections.0.numPersons", number_of_people);
  },

  "User Fills The Age Group In The Recurring Reservation": async (age_group: RobotValue) => {
    await Browser["Click"]('css=[aria-label*="Ikäryhmä. "]');
    await custom_keywords["Find And Click Element With Text"]("span", age_group);
    // An option picked within 200 ms of opening leaves the HDS Select list open
    await custom_keywords["Close Select List If Open"]('[aria-haspopup="listbox"][aria-label*="Ikäryhmä. "]');
  },

  "User Chooses The Purpose Of The Recurring Reservation": async (purpose: RobotValue) => {
    await Browser["Click"]('css=[aria-label*="Varauksen käyttötarkoitus. "]');
    await custom_keywords["Find And Click Element With Text"]("span", purpose);
    await custom_keywords["Close Select List If Open"](
      '[aria-haspopup="listbox"][aria-label*="Varauksen käyttötarkoitus. "]'
    );
  },

  "User Selects The Default Time Period For The Recurring Reservation": async () => {
    await Browser["Click"]("id=applicationSections.0.defaultPeriod");
  },

  "User Selects The Minimum Length For The Recurring Reservation": async (minimum_length: RobotValue) => {
    await Browser["Click"]('css=[aria-label*="Varauksen vähimmäiskesto. "]');
    await custom_keywords["Find And Click Element With Text"]("span", minimum_length);
    await custom_keywords["Close Select List If Open"](
      '[aria-haspopup="listbox"][aria-label*="Varauksen vähimmäiskesto. "]'
    );
  },

  "User Selects The Maximum Length For The Recurring Reservation": async (maximum_length: RobotValue) => {
    await Browser["Click"]('css=[aria-label*="Varauksen enimmäiskesto. "]');
    await custom_keywords["Find And Click Element With Text"]("span", maximum_length);
    await custom_keywords["Close Select List If Open"](
      '[aria-haspopup="listbox"][aria-label*="Varauksen enimmäiskesto. "]'
    );
  },

  "User Selects The Amount Of Reservations Per Week": async (amount_of_reservations_per_week: RobotValue) => {
    await Browser["Type Text"]("id=applicationSections.0.appliedReservationsPerWeek", amount_of_reservations_per_week);
  },

  "User Clicks Continue Button": async () => {
    await Browser["Click"]("id=button__application--next");
  },
});
