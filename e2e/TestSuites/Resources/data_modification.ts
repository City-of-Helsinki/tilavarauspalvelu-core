/** A resource file with keywords. */
import { step, log, expect } from "../../lib/runtime";
import { PageObject } from "../page-object";
import { python_keywords } from "../Resources/python_keywords";
import { SINGLEBOOKING_NAME } from "./texts_FI";

const pad2 = (value: number) => String(value).padStart(2, "0");

/** A date as dd.mm.yyyy, e.g. 05.03.2026 */
const ddmmyyyy = (date: Date) => `${pad2(date.getDate())}.${pad2(date.getMonth() + 1)}.${date.getFullYear()}`;

/** The local time `days` and `hours` from `date`, by the clock: a day stays a day across a DST change */
const addToDate = (date: Date, { days = 0, hours = 0 }) =>
  new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate() + days,
    date.getHours() + hours,
    date.getMinutes(),
    date.getSeconds()
  );

const LETTERS = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

export class DataModification extends PageObject {
  @step("data_modification.Formats Reservation Number And Name For Admin Side")
  // oxlint-disable-next-line eslint/require-await -- keywords are async, each call is a report step
  async formatsReservationNumberAndNameForAdminSide() {
    const bookingNumber_and_NameOfTheBooking = `${this.state.bookingNumOnly}, ${SINGLEBOOKING_NAME}`;
    this.state.bookingNumOnlyBookingNameSubvented = bookingNumber_and_NameOfTheBooking;
  }

  /** Formats the given information as "Ma 25.11.2024 22:30–23:30, 1 t | Aina käsiteltävä kellarikerros (AUTOMAATIOTESTI ÄLÄ POISTA), Harakka, piilokoju" */
  @step("data_modification.Formats Tagline For Admin Side")
  async formatsTaglineForAdminSide(info_card_time_of_reservation: string, name_of_reservationunit: string) {
    // DEVNOTE: Remove 'klo' and any following whitespace using a regular expression
    // This was used when the app didn't include 'klo' in the time format
    // Uncomment the lines below if the app changes back to not including 'klo'
    // ${RESERVATION_TAG_KLO_REMOVED}=  Replace String Using Regexp
    // ...  ${info_card_time_of_reservation}
    // ...  klo\s*
    // ...  ${EMPTY}
    // Log  ${RESERVATION_TAG_KLO_REMOVED}
    // ${RESERVATION_TAG_KLO_REMOVED}=  Evaluate  '${RESERVATION_TAG_KLO_REMOVED}'.strip()
    // Log  ${RESERVATION_TAG_KLO_REMOVED}

    // Use the original time string directly (keeping 'klo' as the app now includes it)
    const RESERVATION_TAG_TIME = info_card_time_of_reservation.trim();

    // Build tagline by default with location
    let RESERVATION_TAG = `${RESERVATION_TAG_TIME} | ${name_of_reservationunit}`;

    // Normalize whitespace: replace multiple spaces with a single space
    RESERVATION_TAG = RESERVATION_TAG.trim().split(/\s+/).join(" ");

    // Save the final formatted tagline for the next keywords (state)
    this.state.reservationTagline = RESERVATION_TAG;

    // Log the final formatted tagline
    await log(this.state.reservationTagline);
  }

  @step("data_modification.Formats Calendar Event Content")
  async formatsCalendarEventContent(
    firstname_used_in_reservation_by_admin: string,
    lastname_used_in_reservation_by_admin: string,
    prefix_fi: string
  ) {
    // This formats string like Puolesta| Puolesta a6
    const result = `${prefix_fi} ${firstname_used_in_reservation_by_admin} ${lastname_used_in_reservation_by_admin}`;
    await log(`Generated string: ${result}`);
    return result;
  }

  /** Converts Finnish short weekday (e.g. "Su") from a datetime string into full English name. */
  @step("data_modification.Convert Finnish Short Day To English")
  async convertFinnishShortDayToEnglish(finnish_datetime: string) {
    // 1: Extract the Finnish short day (first token before the first space)
    // e.g. ['Su','4.5.2025','klo','02:15–02:45,','30','min']
    const parts = finnish_datetime.split(" ");

    // 2: Take the first token as the short day. e.g. 'Su'
    const short_day = parts[0] ?? "";

    // 3: Lowercase the short day e.g. 'Su' --> 'su'
    const cleaned_shortday = short_day.toLowerCase();

    // 4: Define parallel lists of Finnish abbreviations and English full names
    const fi_days = ["ma", "ti", "ke", "to", "pe", "la", "su"];
    const en_days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

    // 5: Look up the index of the Finnish short day
    const idx = fi_days.indexOf(cleaned_shortday);
    expect(idx, `Unknown Finnish day abbreviation "${cleaned_shortday}"`).toBeGreaterThanOrEqual(0);

    // 6: Use the same index to fetch the English full name
    const english_day = en_days[idx] ?? "";
    await log(`English day ➔ ${english_day}`);

    this.state.englishDay = english_day;
  }

  /**
   * Given a start time (HH:MM) and duration (e.g. "60 min"), formats to "HH:MM-HH:MM".
   * Durations over 90 min (like '1t 45min') are not supported.
   */
  @step("data_modification.Compute Reservation Time Slot")
  async computeReservationTimeSlot(reservation_start_time: string, duration: string) {
    // 1: Validate start time (H:MM or HH:MM with optional leading zeros, minutes 00–59)
    expect(
      reservation_start_time,
      'Start time must be "H:MM" or "HH:MM" (with optional leading zero) and valid minutes (00-59)'
    ).toMatch(/^(?:[0-1]?[0-9]|2[0-3]):[0-5][0-9]$/);

    // 2: Validate duration "<digits> min"
    expect(
      duration,
      "Duration must be like \"60 min\". Durations over 90 min (like '1t 45min') are not supported."
    ).toMatch(/^\d+\s*min$/);

    // 3: Split the start time into hour and minute components
    const [start_hour_raw = "", start_min = ""] = reservation_start_time.split(":"); // e.g. "17" or "09", and "30"

    // 3a: Remove leading zero from start hour
    const start_hour = Number.parseInt(start_hour_raw, 10);

    // 4–5: The duration's minutes (e.g. "60 min" → "60")
    const num_str = (duration.split("min")[0] ?? "").replaceAll(" ", "");

    // 6: Add the duration to the start time to get raw end time "HH:MM:SS"
    const end_minutes = start_hour * 60 + Number(start_min) + Number(num_str);
    const end_timer = `${pad2(Math.floor(end_minutes / 60))}:${pad2(end_minutes % 60)}:00`;

    // 7: Extract hour and minute from timer string
    const [end_hour_raw = "", end_min = ""] = end_timer.split(":"); // e.g. "18", and "30"

    // 8: Remove leading zero from end_hour
    const end_hour = Number.parseInt(end_hour_raw, 10);

    // 9: Ensure end time didn’t wrap past midnight
    // a) Must not exceed 23
    expect(end_hour, `End hour ${end_hour} past midnight not supported`).toBeLessThanOrEqual(23);
    // b) Must not be before the start
    expect(end_hour, `End hour ${end_hour} is before start hour ${start_hour}`).toBeGreaterThanOrEqual(start_hour);

    // 10: Combine into final slot (both times without leading zeros)
    const start_time = `${start_hour}:${start_min}`;
    const end_time = `${end_hour}:${end_min}`;
    const full_slot = `${start_time}-${end_time}`;
    await log(`Final reservation slot ➔ ${full_slot}`);

    // 11: Expose for suite use
    this.state.calendarTimeslot = full_slot;
  }

  /** Advances the current date by 1–15 days and adjusts start/end hours by random offsets between 1 and 5. */
  @step("data_modification.Get Modified Date And Time")
  async getModifiedDateAndTime(): Promise<[string, string, string]> {
    // Get the current date and time
    const current_date = new Date();

    // DEVNOTE to test this manually
    // ${current_date}=  Set Variable  2024-04-29 18:52:45

    // Generate random number for days to add (1-15 days)
    const number_day = Math.floor(Math.random() * (15 - 1 + 1)) + 1;

    // Generate random number for the start hour subtraction (1-5 hours)
    const start_hour_subtraction = Math.floor(Math.random() * (5 - 1 + 1)) + 1;

    // Calculate the modified date and times
    const date_plus_x_days = ddmmyyyy(addToDate(current_date, { days: number_day }));
    const start_hour = pad2(addToDate(current_date, { hours: -start_hour_subtraction }).getHours());
    const end_hour = pad2(addToDate(current_date, { hours: -(start_hour_subtraction - 1) }).getHours());

    await log(`Modified date and hours: ${date_plus_x_days}, ${start_hour}–${end_hour}`);

    return [date_plus_x_days, start_hour, end_hour];
  }

  /**
   * Sets format "Pe 1.11.2024 klo 11:00–12:00"
   * to "Alkamisaika: 1.11.2024 klo 11:00" and "Päättymisaika: 1.11.2024 klo 12:00"
   * It adds "Alkamisaika:" and "Päättymisaika:"
   */
  @step("data_modification.Formats Reservation Time To Start And End Time")
  async formatsReservationTimeToStartAndEndTime(time_of_the_reservation: string) {
    // DEVNOTE For testing
    // ${time_of_the_reservation}=  Set variable  Pe 13.9.2024 klo 11:45–12:45
    // This uses en dash (–)

    // Validate the format of the original time string --> "Pe 1.11.2024 klo 11:00–12:00"
    // Port: the result isn't checked, like in the Robot keyword
    python_keywords.validate_timeformat(time_of_the_reservation);

    // Extract the weekday, date, and time range
    const [, date = "", ...time_range_words] = time_of_the_reservation.split(" ");
    const time_range = time_range_words.join(" ");

    // Further split the date into day, month, and year
    const [day, month, year] = date.split(".");

    // Split the time range into start and end times
    const [start_with_klo = "", end_with_spaces = ""] = time_range.split("–");

    // Remove "klo" from start time if present
    // Remove any leading/trailing spaces from the start and end times
    const start_time = start_with_klo.replaceAll("klo", "").trim();
    const end_time = end_with_spaces.trim();

    // Construct the formatted start and end times
    this.state.formattedStarttimeEmail = `Alkamisaika: ${day}.${month}.${year} klo ${start_time}`;
    this.state.formattedEndtimeEmail = `Päättymisaika: ${day}.${month}.${year} klo ${end_time}`;

    await log(this.state.formattedStarttimeEmail);
    await log(this.state.formattedEndtimeEmail);
  }

  /**
   * Format the Finnish date and time into the desired format
   * HH:MM WITH ":" "–" "Ti 5.12.2023 klo 11:30–12:30".
   * this keyword uses hard coded formatting to assume that reservation duration is 60min
   */
  @step("data_modification.Set Info Card Duration Time Info")
  // oxlint-disable-next-line eslint/require-await -- keywords are async, each call is a report step
  async setInfoCardDurationTimeInfo(Timeslot_to_format: string, Date_to_format: string): Promise<[string, string]> {
    // DEVNOTE For testing keyword
    // ${Timeslot_to_format}=  Set Variable  12.15

    // Convert the date from Finnish format to a format suitable for datetime conversion
    let formatted_date = Date_to_format.replaceAll(".", "-");

    // Handle time format to ensure it uses colon as the separator
    const formatted_time = Timeslot_to_format.replaceAll(/[.:]/g, ":");

    // Combine date and time into a single datetime string
    // Strip any extra whitespace or hidden characters from the datetime string
    const date_time_string = `${formatted_date} ${formatted_time}`.trim();

    // Convert string to datetime object (dd-mm-yyyy hh:mm)
    const parsed = /^(?<d>\d{1,2})-(?<m>\d{1,2})-(?<y>\d{4}) (?<H>\d{1,2}):(?<M>\d{1,2})$/.exec(
      date_time_string
    )?.groups;
    if (parsed == null) {
      throw new Error(`time data '${date_time_string}' does not match format '%d-%m-%Y %H:%M'`);
    }
    const date_time = new Date(
      Number(parsed.y),
      Number(parsed.m) - 1,
      Number(parsed.d),
      Number(parsed.H),
      Number(parsed.M)
    );

    // Extracting components directly from a datetime object
    const year = date_time.getFullYear();
    const month = date_time.getMonth() + 1;
    const day = date_time.getDate();
    const hour = pad2(date_time.getHours());
    const minute = pad2(date_time.getMinutes());
    const end_hour = pad2((date_time.getHours() + 1) % 24);

    // Get the Finnish day name from the datetime object using the Python function
    const finnish_day = python_keywords.get_finnish_day(date_time);

    // Format the Finnish date and time into the desired format
    // HH:MM WITH ":" "–" "Ti 5.12.2023 klo 11:30–12:30"
    // 1t comes from duration of the reservation that is set in this test to 1h / 60min
    const finnish_date = `${day}.${month}.${year}`;
    formatted_date = `${finnish_day} ${finnish_date} klo ${hour}:${minute}–${end_hour}:${minute}, 1 t`;
    const formatted_date_minus_t = `${finnish_day} ${finnish_date} klo ${hour}:${minute}–${end_hour}:${minute}`;

    // Return the formatted strings
    return [formatted_date, formatted_date_minus_t];
  }

  @step("data_modification.Generate Random Letter And Number")
  async generateRandomLetterAndNumber() {
    const letter = LETTERS[Math.floor(Math.random() * LETTERS.length)] ?? "";
    const number = Math.floor(Math.random() * 10);
    const random_string = `${letter}${number}`;
    await log(`Generated random string: ${random_string}`);
    return random_string;
  }

  /** Sets the current date plus 60 days in format d.M.yyyy (e.g. 12.2.2012). */
  @step("data_modification.Get Date Plus 60 Days")
  // oxlint-disable-next-line eslint/require-await -- keywords are async, each call is a report step
  async getDatePlus60Days() {
    const current_date = new Date();
    const date_plus_60_days = addToDate(current_date, { days: 60 });

    // Without leading zeros in day and month
    return `${date_plus_60_days.getDate()}.${date_plus_60_days.getMonth() + 1}.${date_plus_60_days.getFullYear()}`;
  }
}
