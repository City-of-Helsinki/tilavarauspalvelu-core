/**
 * The names and types of the Robot variables in `V` (lib/robot.ts), so a misspelled variable fails the type check:
 *
 * - the variables of the variable files, typed by their values;
 * - the users and units that the testData fixture sets from the test's tags (`TestDataVariableName`);
 * - the variables that keywords set while a test runs (Set Test Variable in the Robot suite);
 * - the settings that can be given on the Robot command line.
 *
 * A keyword that sets a new variable adds it to `RuntimeVariables`, or to `UntypedRuntimeVariables` when the value
 * comes from an untyped keyword or the page.
 */
import type { RobotValue } from "../lib/robot";
import type { TestDataVariableName } from "./fixtures";
import type { create_data_variables } from "./Resources/create_data";
import type { devices_variables } from "./Resources/devices";
import type { env_loader_variables } from "./Resources/env_loader";
import type { parallel_test_data_variables } from "./Resources/parallel_test_data";
import type { serial_users_variables } from "./Resources/serial_users";
import type { suite_specific_units_variables } from "./Resources/suite_specific_units";
import type { texts_FI_variables } from "./Resources/texts_FI";
import type { variables_variables } from "./Resources/variables";

type VariableFiles = typeof create_data_variables &
  typeof devices_variables &
  typeof env_loader_variables &
  typeof parallel_test_data_variables &
  typeof serial_users_variables &
  typeof suite_specific_units_variables &
  typeof texts_FI_variables &
  typeof variables_variables;

type TestDataVariables = Record<TestDataVariableName, string>;

/** Set by keywords while a test runs, from string values. */
interface RuntimeVariables {
  /** admin_reservations.Admin Opens Calendar And Changes Reservation Time */
  MODIFIED_STARTTIME_SUBVENTED_RESERVATION: string;
  /** app_admin.Admin Creates Error/Warning Notification For User And Admin Side */
  NOTIFICATION_BANNER_MESSAGE_NAME_ERROR: string;
  NOTIFICATION_BANNER_MESSAGE_NAME_WARNING: string;
}

/**
 * Set by keywords while a test runs, from values whose type the type check can't see: texts read from the page,
 * numbers and dates that keywords compute, browser and page ids. Their defaults in the variable files are strings,
 * but the values set at runtime need not be, so they are `RobotValue` here.
 */
type UntypedRuntimeVariables = Record<
  | "ACCESS_CODE"
  | "ACCESS_CODE_ADMINSIDE"
  | "ADMIN_BEHALF_LASTNAME_FI"
  | "ADMIN_MODIFIES_TIME_OF_INFO_CARD"
  | "ADMIN_MODIFIES_TIME_OF_INFO_CARD_MINUS_T"
  | "BOOKING_NUM_ONLY"
  | "BOOKING_NUM_ONLY_BOOKING_NAME_SUBVENTED"
  | "BROWSER_ADMIN_SIDE"
  | "BROWSER_USER_SIDE"
  | "CALENDAR_CONTROL_TIME_OF_FREE_SLOT"
  | "CALENDAR_EVENT_NAME"
  | "CALENDAR_TIMESLOT"
  | "END_TIME_FROM_ICS"
  | "ENGLISH_DAY"
  | "FORMATTED_END_TO_ICS"
  | "FORMATTED_START_TO_ICS"
  | "ICS_TEXT_FROM_FILE"
  | "MODIFIED_DATE_SUBVENTED_RESERVATION"
  | "MODIFIED_HOUR_ENDTIME_SUBVENTED_RESERVATION"
  | "MODIFIED_HOUR_STARTTIME_SUBVENTED_RESERVATION"
  | "NOTIFICATION_ACTIVE_UNTIL"
  | "PAGE1"
  | "PAGE_ADMIN_SIDE"
  | "PAGE_USER_SIDE"
  | "RESERVATION_NUMBER_ADMINSIDE"
  | "RESERVATION_TAGLINE"
  | "START_TIME_FROM_ICS"
  | "TIME_OF_QUICK_RESERVATION"
  | "TIME_OF_QUICK_RESERVATION_FREE_SLOT"
  | "TIME_OF_QUICK_RESERVATION_MINUS_T"
  | "TIME_OF_QUICK_RESERVATION_MINUS_T_MODIFIED"
  | "TIME_OF_QUICK_RESERVATION_MODIFIED"
  | "UNAVAILABLE_RESERVATION_DATE"
  | "UNAVAILABLE_RESERVATION_HOUR_ENDTIME"
  | "UNAVAILABLE_RESERVATION_HOUR_STARTTIME",
  RobotValue
>;

/** `robot --variable NAME:value` settings that create_data reads when they are given. */
interface CommandLineVariables {
  TOKEN?: string;
  ENDPOINT?: string;
}

declare module "../lib/robot" {
  interface Variables
    extends
      Omit<VariableFiles, keyof UntypedRuntimeVariables>,
      TestDataVariables,
      RuntimeVariables,
      UntypedRuntimeVariables,
      CommandLineVariables {}
}
