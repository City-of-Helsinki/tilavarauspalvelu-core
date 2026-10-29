/** A resource file with keywords. */
import { Collections } from "../../lib/Collections";
import { DateTime } from "../../lib/DateTime";
import { V, named, str, step, log, expect } from "../../lib/robot";
import type { RobotValue } from "../../lib/robot";
import { String_ } from "../../lib/String";
import "../Resources/parallel_test_data";
import { PageObject } from "../page-object";
import "../Resources/variables";
import "../Resources/texts_FI";
import "../Resources/serial_users";
import { python_keywords } from "../Resources/python_keywords";

export class DataModification extends PageObject {
  @step("data_modification.Formats Reservation Number And Name For Admin Side")
  // oxlint-disable-next-line eslint/require-await -- keywords are async, each call is a report step
  async formatsReservationNumberAndNameForAdminSide() {
    let bookingNumber_and_NameOfTheBooking: RobotValue;
    bookingNumber_and_NameOfTheBooking = `${str(V.BOOKING_NUM_ONLY)}, ${str(V.SINGLEBOOKING_NAME)}`;
    V.BOOKING_NUM_ONLY_BOOKING_NAME_SUBVENTED = bookingNumber_and_NameOfTheBooking;
  }

  /** Formats the given information as "Ma 25.11.2024 22:30–23:30, 1 t | Aina käsiteltävä kellarikerros (AUTOMAATIOTESTI ÄLÄ POISTA), Harakka, piilokoju" */
  @step("data_modification.Formats Tagline For Admin Side")
  async formatsTaglineForAdminSide(info_card_time_of_reservation: RobotValue, name_of_reservationunit: string) {
    let RESERVATION_TAG_TIME: RobotValue, RESERVATION_TAG: RobotValue;
    // Log the original time of reservation string
    await log(info_card_time_of_reservation);
    await log(name_of_reservationunit);

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
    RESERVATION_TAG_TIME = str(info_card_time_of_reservation).trim();

    // Log the result after stripping whitespace
    await log(RESERVATION_TAG_TIME);

    // Build tagline by default with location
    RESERVATION_TAG = `${str(RESERVATION_TAG_TIME)} | ${name_of_reservationunit}`;

    // Normalize whitespace: replace multiple spaces with a single space
    RESERVATION_TAG = str(RESERVATION_TAG).trim().split(/\s+/).join(" ");

    // Set the suite variable to hold the final formatted tagline
    V.RESERVATION_TAGLINE = RESERVATION_TAG;

    // Log the final formatted tagline
    await log(V.RESERVATION_TAGLINE);
  }

  @step("data_modification.Formats Calendar Event Content")
  async formatsCalendarEventContent(
    firstname_used_in_reservation_by_admin: string,
    lastname_used_in_reservation_by_admin: RobotValue,
    prefix_fi: string
  ) {
    let result: RobotValue;
    // This formats string like Puolesta| Puolesta a6
    result = `${prefix_fi} ${firstname_used_in_reservation_by_admin} ${str(lastname_used_in_reservation_by_admin)}`;
    await log(`Generated string: ${str(result)}`);
    return result;
  }

  /** Converts Finnish short weekday (e.g. "Su") from a datetime string into full English name. */
  @step("data_modification.Convert Finnish Short Day To English")
  async convertFinnishShortDayToEnglish(finnish_datetime: RobotValue) {
    let parts: RobotValue,
      short_day: RobotValue,
      cleaned_shortday: RobotValue,
      fi_days: RobotValue,
      en_days: RobotValue,
      idx: RobotValue,
      english_day: RobotValue;
    await log(`Finnish datetime: ${str(finnish_datetime)}`);

    // 1: Extract the Finnish short day (first token before the first space)
    // e.g. ['Su','4.5.2025','klo','02:15–02:45,','30','min']
    parts = await String_["Split String"](finnish_datetime, " ");

    // 2: Take the first token as the short day. e.g. 'Su'
    short_day = await Collections["Get From List"](parts, "0");

    // 3: Lowercase the short day e.g. 'Su' --> 'su'
    cleaned_shortday = await String_["Convert To Lowercase"](short_day);

    await log(`Normalized key ➔ ${str(cleaned_shortday)}`);

    // 4: Define parallel lists of Finnish abbreviations and English full names
    fi_days = ["ma", "ti", "ke", "to", "pe", "la", "su"];
    en_days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

    // 5: Look up the index of the Finnish short day
    idx = await Collections["Get Index From List"](fi_days, cleaned_shortday);
    expect(Number(idx), `Unknown Finnish day abbreviation "${str(cleaned_shortday)}"`).toBeGreaterThanOrEqual(0);

    // 6: Use the same index to fetch the English full name
    english_day = await Collections["Get From List"](en_days, idx);

    V.ENGLISH_DAY = english_day;
    english_day = V.ENGLISH_DAY;
  }

  /**
   * Given a start time (HH:MM) and duration (e.g. "60 min"), formats to "HH:MM-HH:MM".
   * Durations over 90 min (like '1t 45min') are not supported.
   */
  @step("data_modification.Compute Reservation Time Slot")
  async computeReservationTimeSlot(reservation_start_time: RobotValue, duration: string) {
    let start_parts: RobotValue,
      start_hour_raw: RobotValue,
      start_min: RobotValue,
      start_hour: RobotValue,
      start_interval: RobotValue,
      parts: RobotValue,
      num_str: RobotValue,
      duration_str: RobotValue,
      end_timer: RobotValue,
      end_parts: RobotValue,
      end_hour: RobotValue,
      end_min: RobotValue,
      start_h_int: RobotValue,
      end_h_int: RobotValue,
      start_time: RobotValue,
      end_time: RobotValue,
      full_slot: RobotValue;
    await log(`Reservation start time: ${str(reservation_start_time)}`);
    await log(`Duration: ${duration}`);

    // 1: Validate start time (H:MM or HH:MM with optional leading zeros, minutes 00–59)
    expect(
      String(reservation_start_time),
      'Start time must be "H:MM" or "HH:MM" (with optional leading zero) and valid minutes (00-59)'
    ).toMatch(/^(?:[0-1]?[0-9]|2[0-3]):[0-5][0-9]$/);

    // 2: Validate duration "<digits> min"
    expect(
      String(duration),
      "Duration must be like \"60 min\". Durations over 90 min (like '1t 45min') are not supported."
    ).toMatch(/^\d+\s*min$/);

    // 3: Split the start time into hour and minute components
    start_parts = await String_["Split String"](reservation_start_time, ":");
    start_hour_raw = await Collections["Get From List"](start_parts, "0"); // e.g. "17" or "09"
    start_min = await Collections["Get From List"](start_parts, "1"); // e.g. "30"

    // 3a: Remove leading zero from start hour
    start_hour = Number.parseInt(String(start_hour_raw), 10);
    await log(`Parsed start: ${str(start_hour)}h ${str(start_min)}m (leading zero removed if present)`);

    // 4: Build a time interval string for the start (e.g. "17 hours 30 minutes")
    start_interval = `${str(start_hour)} hours ${str(start_min)} minutes`;
    await log(`Start interval ➔ ${str(start_interval)}`);

    // 5: Normalize duration to full words (e.g. "60 min" → "60 minutes")
    parts = await String_["Split String"](duration, "min");
    num_str = await Collections["Get From List"](parts, "0");
    num_str = await String_["Replace String"](num_str, " ", "");
    duration_str = `${str(num_str)} minutes`;
    await log(`Normalized duration ➔ ${str(duration_str)}`);

    // 6: Add start interval and duration to get raw end time "HH:MM:SS"
    end_timer = await DateTime["Add Time To Time"](
      start_interval,
      duration_str,
      named({ result_format: "timer", exclude_millis: "True" })
    );
    await log(`Raw timer end ➔ ${str(end_timer)}`);

    // 7: Extract hour and minute from timer string
    end_parts = await String_["Split String"](end_timer, ":");
    end_hour = await Collections["Get From List"](end_parts, "0"); // e.g. "18"
    end_min = await Collections["Get From List"](end_parts, "1"); // e.g. "30"
    await log(`Computed end: ${str(end_hour)}h ${str(end_min)}m`);

    // 8: Remove leading zero from end_hour
    end_hour = Number.parseInt(String(end_hour), 10);
    await log(`End hour without leading zero ➔ ${str(end_hour)}`);

    // 9: Ensure end time didn’t wrap past midnight
    start_h_int = Number.parseInt(String(start_hour), 10);
    end_h_int = Number.parseInt(String(end_hour), 10);

    // a) Must not exceed 23
    expect(Number(end_h_int), `End hour ${str(end_h_int)} past midnight not supported`).toBeLessThanOrEqual(23);
    // b) Must not be before the start
    expect(
      Number(end_h_int),
      `End hour ${str(end_h_int)} is before start hour ${str(start_h_int)}`
    ).toBeGreaterThanOrEqual(Number(start_h_int));

    // 10: Combine into final slot (both times without leading zeros)
    start_time = `${str(start_hour)}:${str(start_min)}`;
    end_time = `${str(end_hour)}:${str(end_min)}`;
    full_slot = `${str(start_time)}-${str(end_time)}`;
    await log(`Final reservation slot ➔ ${str(full_slot)}`);

    // 11: Expose for suite use
    V.CALENDAR_TIMESLOT = full_slot;
  }

  /** Advances the current date by 1–15 days and adjusts start/end hours by random offsets between 1 and 5. */
  @step("data_modification.Get Modified Date And Time")
  async getModifiedDateAndTime() {
    let current_date: RobotValue,
      number_day: RobotValue,
      start_hour_subtraction: RobotValue,
      date_plus_x_days: RobotValue,
      start_hour: RobotValue,
      end_hour: RobotValue;
    // Get the current date and time
    current_date = await DateTime["Get Current Date"](named({ result_format: "%Y-%m-%d %H:%M:%S" }));

    // DEVNOTE to test this manually
    // ${current_date}=  Set Variable  2024-04-29 18:52:45

    // Generate random number for days to add (1-15 days)
    number_day = Math.floor(Math.random() * (15 - 1 + 1)) + 1;
    await log(number_day);

    // Generate random number for the start hour subtraction (1-5 hours)
    start_hour_subtraction = Math.floor(Math.random() * (5 - 1 + 1)) + 1;
    await log(`Start hour subtraction: ${str(start_hour_subtraction)}`);

    // Calculate the modified date and times
    date_plus_x_days = await DateTime["Add Time To Date"](
      current_date,
      `${str(number_day)} days`,
      named({ result_format: "%d.%m.%Y" })
    );
    start_hour = await DateTime["Add Time To Date"](
      current_date,
      `-${str(start_hour_subtraction)} hours`,
      named({ result_format: "%H" })
    );
    end_hour = await DateTime["Add Time To Date"](
      current_date,
      `-${str(Number(start_hour_subtraction) - 1)} hours`,
      named({ result_format: "%H" })
    );

    await log(date_plus_x_days);
    await log(start_hour);
    await log(end_hour);

    return [date_plus_x_days, start_hour, end_hour];
  }

  /**
   * Sets format "Pe 1.11.2024 klo 11:00–12:00"
   * to "Alkamisaika: 1.11.2024 klo 11:00" and "Päättymisaika: 1.11.2024 klo 12:00"
   * It adds "Alkamisaika:" and "Päättymisaika:"
   */
  @step("data_modification.Formats Reservation Time To Start And End Time")
  async formatsReservationTimeToStartAndEndTime(time_of_the_reservation: RobotValue) {
    let date: RobotValue,
      time_range: RobotValue,
      day: RobotValue,
      month: RobotValue,
      year: RobotValue,
      start_time: RobotValue,
      end_time: RobotValue;
    // oxlint-disable-next-line eslint/no-unused-vars -- assigned but not read in the Robot keyword
    let time_format_is_valid: RobotValue;
    // oxlint-disable-next-line eslint/no-unused-vars -- assigned but not read in the Robot keyword
    let weekday: RobotValue;
    await log("This sets the FORMATTED_STARTTIME and FORMATTED_ENDTIME");

    // DEVNOTE For testing
    // ${time_of_the_reservation}=  Set variable  Pe 13.9.2024 klo 11:45–12:45
    // This uses en dash (–)

    // Validate the format of the original time string --> "Pe 1.11.2024 klo 11:00–12:00"
    time_format_is_valid = python_keywords.validate_timeformat(time_of_the_reservation);

    // Extract the weekday, date, and time range
    [weekday, date, time_range] = await String_["Split String"](time_of_the_reservation, " ", "2");

    // Further split the date into day, month, and year
    [day, month, year] = await String_["Split String"](date, ".");

    // Split the time range into start and end times
    [start_time, end_time] = await String_["Split String"](time_range, "–");

    // Remove "klo" from start time if present
    start_time = await String_["Remove String"](start_time, "klo");

    // Remove any leading/trailing spaces from the start and end times
    start_time = await String_["Strip String"](start_time);
    end_time = await String_["Strip String"](end_time);

    // Construct the formatted start and end times
    V.FORMATTED_STARTTIME_EMAIL = `Alkamisaika: ${str(day)}.${str(month)}.${str(year)} klo ${str(start_time)}`;
    V.FORMATTED_ENDTIME_EMAIL = `Päättymisaika: ${str(day)}.${str(month)}.${str(year)} klo ${str(end_time)}`;

    await log(V.FORMATTED_STARTTIME_EMAIL);
    await log(V.FORMATTED_ENDTIME_EMAIL);
  }

  /**
   * Format the Finnish date and time into the desired format
   * HH:MM WITH ":" "–" "Ti 5.12.2023 klo 11:30–12:30".
   * this keyword uses hard coded formatting to assume that reservation duration is 60min
   */
  @step("data_modification.Set Info Card Duration Time Info")
  async setInfoCardDurationTimeInfo(Timeslot_to_format: RobotValue, Date_to_format: RobotValue) {
    let formatted_date: RobotValue,
      formatted_time: RobotValue,
      date_time_string: RobotValue,
      date_time: RobotValue,
      year: RobotValue,
      month: RobotValue,
      day: RobotValue,
      hour: RobotValue,
      minute: RobotValue,
      end_hour: RobotValue,
      finnish_day: RobotValue,
      finnish_date: RobotValue,
      formatted_date_minus_t: RobotValue;
    await log(`Timeslot to format: ${str(Timeslot_to_format)}`);
    await log(`Date to format: ${str(Date_to_format)}`);

    // DEVNOTE For testing keyword
    // ${Timeslot_to_format}=  Set Variable  12.15

    // Convert the date from Finnish format to a format suitable for datetime conversion
    formatted_date = await String_["Replace String"](Date_to_format, ".", "-");

    // Handle time format to ensure it uses colon as the separator
    formatted_time = await String_["Replace String Using Regexp"](Timeslot_to_format, "[.:]", ":");

    // Combine date and time into a single datetime string
    date_time_string = `${str(formatted_date)} ${str(formatted_time)}`;

    // Strip any extra whitespace or hidden characters from the datetime string
    date_time_string = await String_["Strip String"](date_time_string);
    await log(`Formatted datetime string: ${str(date_time_string)}`);

    // Convert string to datetime object
    date_time = await DateTime["Convert Date"](
      date_time_string,
      named({ result_format: "datetime", date_format: "%d-%m-%Y %H:%M" })
    );

    // Extracting components directly from a datetime object
    year = date_time.year;
    month = date_time.month;
    day = date_time.day;
    hour = String(date_time.hour).padStart(2, "0");
    minute = String(date_time.minute).padStart(2, "0");
    end_hour = String((date_time.hour + 1) % 24).padStart(2, "0");

    // Get the Finnish day name from the datetime object using the Python function
    finnish_day = python_keywords.get_finnish_day(date_time);

    // Format the Finnish date and time into the desired format
    // HH:MM WITH ":" "–" "Ti 5.12.2023 klo 11:30–12:30"
    // 1t comes from duration of the reservation that is set in this test to 1h / 60min
    finnish_date = `${str(day)}.${str(month)}.${str(year)}`;
    formatted_date = `${str(finnish_day)} ${str(finnish_date)} klo ${str(hour)}:${str(minute)}–${str(end_hour)}:${str(minute)}, 1 t`;
    formatted_date_minus_t = `${str(finnish_day)} ${str(finnish_date)} klo ${str(hour)}:${str(minute)}–${str(end_hour)}:${str(minute)}`;

    // Return the formatted strings
    return [formatted_date, formatted_date_minus_t];
  }

  @step("data_modification.Generate Random Letter And Number")
  async generateRandomLetterAndNumber() {
    let letter: RobotValue, number: RobotValue, random_string: RobotValue;
    letter = await String_["Generate Random String"]("1", "[LETTERS]");
    number = await String_["Generate Random String"]("1", "[NUMBERS]");
    random_string = `${str(letter)}${str(number)}`;
    await log(`Generated random string: ${str(random_string)}`);
    return random_string;
  }

  /** Sets the current date plus 60 days in format d.M.yyyy (e.g. 12.2.2012). */
  @step("data_modification.Get Date Plus 60 Days")
  async getDatePlus60Days() {
    let current_date: RobotValue, date_plus_60_days: RobotValue, day: RobotValue, month: RobotValue, year: RobotValue;
    current_date = await DateTime["Get Current Date"](named({ result_format: "%Y-%m-%d" }));
    date_plus_60_days = await DateTime["Add Time To Date"](
      current_date,
      "60 days",
      named({ result_format: "%d.%m.%Y" })
    );

    // Remove leading zeros from day and month
    [day, month, year] = await String_["Split String"](date_plus_60_days, ".");
    day = Number.parseInt(String(day), 10);
    month = Number.parseInt(String(month), 10);
    date_plus_60_days = `${str(day)}.${str(month)}.${str(year)}`;

    return date_plus_60_days;
  }
}
