/**
 * Test data management with parallel and sequential execution support.
 * THIS FILE CONTAINS THE LOGIC that decides which user data to use.
 * It imports serial_users.robot to access fallback/shared user data.
 * TWO EXECUTION MODES:
 * 1. PARALLEL MODE:
 * Command: pabot --pabotlib --resourcefile pabot_users.dat --processes N
 * Data source: pabot_users.dat
 * Behavior: Each test gets UNIQUE user, tests run in parallel
 * 2. SEQUENTIAL MODE (uses serial_users.robot):
 * Command: robot --variable FORCE_SINGLE_USER:True
 * Data source: serial_users.robot
 * Behavior: All tests share same users, tests run one at a time
 * WHEN SEQUENTIAL MODE IS TRIGGERED:
 * - Explicitly: --variable FORCE_SINGLE_USER:True is set
 * - Automatically: Running without pabot (robot command)
 * - Fallback: Value set acquisition from pabot_users.dat fails
 */
import { BuiltIn } from "../../lib/BuiltIn";
import { PabotLib } from "../../lib/PabotLib";
import {
  V,
  errorMessage,
  isTruthy,
  keywords,
  named,
  registerVariables,
  rethrowSkip,
  robot,
  str,
  testInfo,
} from "../../lib/robot";
import type { RobotValue } from "../../lib/robot";
import "../Resources/serial_users";

export const parallel_test_data_variables = {
  FORCE_SINGLE_USER: false,
};
registerVariables(parallel_test_data_variables);

export const parallel_test_data = keywords("parallel_test_data", {
  /**
   * Tag-based test data initialization
   * Determines data type and value set from test tags:
   * - Data set tag: desktop-test-data-set-0, admin-test-data-set-2, etc.
   * - Falls back to sequential mode if no pabot or FORCE_SINGLE_USER=True
   * Sequential mode (single user mode) uses:
   * - Regular user: Ande AutomaatioTesteri (BASIC_USER_MALE)
   * - Admin user: TirehtööriPääkäytäjä Tötterstrom (BASIC_ADMIN_MALE)
   * - Django admin (permissions): Kari Kekkonen (BASIC_DJANGO_ADMIN)
   * - Permission target admin: Marika Salminen (BASIC_PERMISSION_TARGET_ADMIN)
   * PARALLEL MODE: Uses PabotLib to acquire value sets by tag → unique users
   * SEQUENTIAL MODE: Uses basic users from serial_users.robot → shared users
   * EXAMPLE TAGS:
   * [Tags]
   * desktop-test-data-set-0
   * desktop-suite
   * smoke
   * [Tags]
   * admin-test-data-set-2
   * admin-suite
   * permissions
   */
  "Initialize Test Data From Tags": async () => {
    let test_name: RobotValue,
      suite_name: RobotValue,
      process_id: RobotValue,
      test_tags: RobotValue,
      value_set_name: RobotValue,
      has_admin: RobotValue,
      has_combined: RobotValue,
      has_permissions: RobotValue,
      has_user: RobotValue,
      permission_test_type: RobotValue,
      force_single: RobotValue,
      status: RobotValue,
      error: RobotValue;
    // Get test context
    test_name = robot.TEST_NAME ?? "unknown_test";
    suite_name = robot.SUITE_NAME ?? "unknown_suite";
    process_id = robot.PABOTEXECUTIONPOOLID ?? null;
    test_tags = robot.TEST_TAGS ?? "[]";

    await BuiltIn["Log"](`🏷️ Initializing test data from tags for: ${str(test_name)}`);
    await BuiltIn["Log"](`📋 Suite: ${str(suite_name)}`);
    await BuiltIn["Log"](`🏷️ Tags: ${str(test_tags)}`);
    await BuiltIn["Log"](`🔧 Process ID: ${str(process_id)}`);

    // Parse all tags and set flags
    [value_set_name, has_admin, has_combined, has_permissions, has_user, permission_test_type] =
      await parallel_test_data["Parse Test Tags"](test_tags);

    if (str(value_set_name) === "None") {
      await BuiltIn["Log"]("⚠️ No data set tag found, using single user mode fallback");
      await parallel_test_data["Use Single User Mode From Parsed Tags"](
        has_admin,
        has_combined,
        has_permissions,
        has_user,
        permission_test_type
      );
      return;
    }

    await BuiltIn["Log"](`🎯 Found data set tag: ${str(value_set_name)}`);

    // Check if we should force single user mode
    force_single = V.FORCE_SINGLE_USER ?? false;
    if (isTruthy(force_single)) {
      await BuiltIn["Log"]("Using FORCE_SINGLE_USER mode - using basic users from serial_users.robot");
      await parallel_test_data["Use Single User Mode From Parsed Tags"](
        has_admin,
        has_combined,
        has_permissions,
        has_user,
        permission_test_type
      );
      return;
    }

    // Check if running without pabot (Code editor, single execution)
    if (str(process_id) === "None") {
      await BuiltIn["Log"]("Non-parallel execution detected - using single user mode");
      await parallel_test_data["Use Single User Mode From Parsed Tags"](
        has_admin,
        has_combined,
        has_permissions,
        has_user,
        permission_test_type
      );
      return;
    }

    // PARALLEL MODE: Acquire value set by name
    await BuiltIn["Log"](`Attempting to acquire PabotLib value set: ${str(value_set_name)}`);
    status = await BuiltIn["Run Keyword And Return Status"](PabotLib["Acquire Value Set"], value_set_name);

    if (isTruthy(status)) {
      V.CURRENT_VALUE_SET = value_set_name;
      await BuiltIn["Log"](`✓ Successfully acquired PabotLib value set: ${str(value_set_name)}`);

      // Import variables based on pre-parsed tag flags
      try {
        if (isTruthy(has_combined)) {
          // COMBINED tests: Load both user and admin variables
          await parallel_test_data["Set User Variables From Value Set"]();
          await parallel_test_data["Set Admin Variables From Value Set"]();
          await BuiltIn["Log"]("✓ Both user and admin variables set from value set");
        } else if (isTruthy(has_admin)) {
          // ADMIN tests: Load admin variables (or Django admin for permissions)
          if (isTruthy(has_permissions)) {
            // Permission test: Load only Django admin and permission target
            await BuiltIn["Log"]("Permission test detected - loading Django admin and permission target only");
            await parallel_test_data["Set Django Admin Variables From Value Set"]();
            await parallel_test_data["Set Permission Target Admin Variables From Value Set"]();
            await BuiltIn["Log"]("✓ Permission test: Django admin and permission target variables set");
          } else {
            // Normal admin test: Load only standard admin variables
            await parallel_test_data["Set Admin Variables From Value Set"]();
            await BuiltIn["Log"]("✓ Admin variables set from value set");
          }
        } else if (isTruthy(has_user)) {
          // USER tests: Load only user variables
          await parallel_test_data["Set User Variables From Value Set"]();
          await BuiltIn["Log"]("✓ User variables set from value set");
        } else {
          await BuiltIn["Log"]("⚠️ WARNING: No valid test type detected, using user variables as fallback");
          await parallel_test_data["Set User Variables From Value Set"]();
        }
      } catch (err) {
        rethrowSkip(err);
        error = errorMessage(err);
        await BuiltIn["Log"](`⚠️ WARNING: Failed to get variables from value set: ${str(error)}`);
        await BuiltIn["Log"]("Falling back to single user mode");
        await parallel_test_data["Use Single User Mode From Parsed Tags"](
          has_admin,
          has_combined,
          has_permissions,
          has_user,
          permission_test_type
        );
      }
    } else {
      await BuiltIn["Log"](`⚠️ WARNING: Value set ${str(value_set_name)} not available`);
      await BuiltIn["Log"]("Falling back to single user mode");
      await parallel_test_data["Use Single User Mode From Parsed Tags"](
        has_admin,
        has_combined,
        has_permissions,
        has_user,
        permission_test_type
      );
    }
  },

  /**
   * Parse test tags and return all relevant information
   * Returns: data_set_name, has_admin_tag, has_combined_tag, has_permissions_tag, has_user_tag, permission_test_type
   * permission_test_type values: 'unit-permissions-test', 'unit-group-permissions-test', 'general-permissions-test', or ${NONE}
   * has_permissions_tag is auto-detected from specific permission type tags (no generic 'permissions' tag needed)
   * Example:
   * Tags: ['admin-suite', 'admin-test-data-set-2', 'general-permissions-test']
   * Returns: 'admin-test-data-set-2', True, False, True, False, 'general-permissions-test'
   */
  "Parse Test Tags": async (tags: RobotValue) => {
    let data_set_name: RobotValue,
      has_admin_tag: RobotValue,
      has_combined_tag: RobotValue,
      has_permissions_tag: RobotValue,
      has_user_tag: RobotValue,
      permission_test_type: RobotValue,
      tag: RobotValue,
      is_data_set: RobotValue,
      is_admin: RobotValue,
      is_combined: RobotValue,
      is_desktop: RobotValue,
      is_mobile_android: RobotValue,
      is_mobile_iphone: RobotValue;
    // Initialize all flags
    data_set_name = null;
    has_admin_tag = false;
    has_combined_tag = false;
    has_permissions_tag = false;
    has_user_tag = false;
    permission_test_type = null;

    // Single pass through all tags
    for (tag of tags) {
      is_data_set = await BuiltIn["Run Keyword And Return Status"](
        BuiltIn["Should Match Regexp"],
        tag,
        "^(desktop-test-data|admin-test-data|mobile-android-data|mobile-iphone-data|combined-test-data)-set-\\d+$"
      );
      if (isTruthy(is_data_set)) {
        data_set_name = tag;
      }

      // Check for suite type tags
      is_admin = await BuiltIn["Run Keyword And Return Status"](BuiltIn["Should Start With"], tag, "admin-test-data");
      if (isTruthy(is_admin)) {
        has_admin_tag = true;
      }

      is_combined = await BuiltIn["Run Keyword And Return Status"](
        BuiltIn["Should Start With"],
        tag,
        "combined-test-data"
      );
      if (isTruthy(is_combined)) {
        has_combined_tag = true;
      }

      is_desktop = await BuiltIn["Run Keyword And Return Status"](
        BuiltIn["Should Start With"],
        tag,
        "desktop-test-data"
      );
      is_mobile_android = await BuiltIn["Run Keyword And Return Status"](
        BuiltIn["Should Start With"],
        tag,
        "mobile-android-data"
      );
      is_mobile_iphone = await BuiltIn["Run Keyword And Return Status"](
        BuiltIn["Should Start With"],
        tag,
        "mobile-iphone-data"
      );
      if (isTruthy(is_desktop) || isTruthy(is_mobile_android) || isTruthy(is_mobile_iphone)) {
        has_user_tag = true;
      }

      // Check for specific permission test type tags
      if (str(tag) === "unit-permissions-test") {
        permission_test_type = "unit-permissions-test";
      } else if (str(tag) === "unit-group-permissions-test") {
        permission_test_type = "unit-group-permissions-test";
      } else if (str(tag) === "general-permissions-test") {
        permission_test_type = "general-permissions-test";
      }
    }

    // Auto-detect permission test from specific permission type tags
    if (str(permission_test_type) !== "None") {
      has_permissions_tag = true;
    }

    // Log parsed results for easy debugging
    await BuiltIn["Log"](
      `📊 Parsed tags: data_set='${str(data_set_name)}', admin=${str(has_admin_tag)}, combined=${str(has_combined_tag)}, permissions=${str(has_permissions_tag)}, user=${str(has_user_tag)}, perm_type='${str(permission_test_type)}'`
    );

    return [data_set_name, has_admin_tag, has_combined_tag, has_permissions_tag, has_user_tag, permission_test_type];
  },

  /**
   * Sets test variables based on pre-parsed tag flags in single user mode
   * ...
   * Arguments:
   * - has_admin: Boolean indicating admin test
   * - has_combined: Boolean indicating combined test
   * - has_permissions: Boolean indicating permission test
   * - has_user: Boolean indicating user test
   * - permission_test_type: Type of permission test or ${NONE}
   */
  "Use Single User Mode From Parsed Tags": async (
    has_admin: RobotValue,
    has_combined: RobotValue,
    has_permissions: RobotValue,
    has_user: RobotValue,
    permission_test_type: RobotValue = null
  ) => {
    await BuiltIn["Log"](
      `Parsed mode flags: has_admin=${str(has_admin)}, has_combined=${str(has_combined)}, has_permissions=${str(has_permissions)}, has_user=${str(has_user)}`,
      named({ level: "DEBUG" })
    );

    // Set user variables for user and combined tests
    if (!isTruthy(has_admin) || isTruthy(has_combined)) {
      await BuiltIn["Log"](`Using single user mode: ${str(V.BASIC_USER_MALE_FULLNAME)}`);
      V.CURRENT_USER_EMAIL = V.BASIC_USER_MALE_EMAIL;
      V.CURRENT_USER_HETU = V.BASIC_USER_MALE_HETU;
      V.CURRENT_USER_PHONE = V.BASIC_USER_MALE_PHONE;
      V.CURRENT_USER_FIRST_NAME = V.BASIC_USER_MALE_FIRSTNAME;
      V.CURRENT_USER_LAST_NAME = V.BASIC_USER_MALE_LASTNAME;
      V.CURRENT_USER_FULLNAME = `${str(V.BASIC_USER_MALE_FIRSTNAME)} ${str(V.BASIC_USER_MALE_LASTNAME)}`;
      V.CURRENT_PASSWORD = V.BASIC_USER_MALE_PASSWORD;
    }

    // Set admin variables for admin and combined tests
    if (isTruthy(has_admin) || isTruthy(has_combined)) {
      if (isTruthy(has_permissions)) {
        await BuiltIn["Log"]("Permission test detected - loading Django admin and permission target only");
        await parallel_test_data["Use Single Django And Permission Admin Mode"](permission_test_type);
        await BuiltIn["Log"]("✓ Permission test: Django admin and permission target variables set");
      } else {
        // Normal admin test: Load only standard admin
        await parallel_test_data["Use Single Admin User Mode"]();
        await BuiltIn["Log"]("✓ Single admin mode: Admin variables set");
      }
    }
  },

  /** Sets admin test variables to use the default admin user (TirehtööriPääkäytäjä Tötterstrom) */
  "Use Single Admin User Mode": async () => {
    await BuiltIn["Log"]("Using single admin user mode: TirehtööriPääkäytäjä Tötterstrom");
    V.ADMIN_CURRENT_USER_EMAIL = V.BASIC_ADMIN_MALE_EMAIL;
    V.ADMIN_CURRENT_USER_HETU = V.BASIC_ADMIN_MALE_HETU;
    V.ADMIN_CURRENT_USER_FIRST_NAME = V.BASIC_ADMIN_MALE_FIRSTNAME;
    V.ADMIN_CURRENT_USER_LAST_NAME = V.BASIC_ADMIN_MALE_LASTNAME;
    V.ADMIN_CURRENT_USER_FULLNAME = V.BASIC_ADMIN_MALE_FULLNAME;
    V.ADMIN_CURRENT_USER_PASSWORD = V.BASIC_ADMIN_MALE_PASSWORD;
  },

  /**
   * Sets admin variables for permission tests in single mode
   * Sets two groups of variables:
   * 1. DJANGO_ADMIN_* (Kari Kekkonen - performs permission changes)
   * 2. PERMISSION_TARGET_ADMIN_* (whose permissions are modified - varies by test)
   * Note: Does NOT set ADMIN_CURRENT_USER_*
   * Permission tests explicitly use PERMISSION_TARGET_ADMIN_* for login (uses HETU, not password)
   * Permission target admin is mapped from permission_test_type:
   * - unit-permissions-test: Niko Selänne (admin-test-data-set-3)
   * - unit-group-permissions-test: Mikko Mäkinen (admin-test-data-set-4)
   * - general-permissions-test or ${NONE}: Marika Salminen (admin-test-data-set-2)
   */
  "Use Single Django And Permission Admin Mode": async (permission_test_type: RobotValue = null) => {
    await BuiltIn["Log"](`Using single Django and permission admin mode (type: ${str(permission_test_type)})`);

    // Set Django admin (Kari Kekkonen) - performs permission changes
    await BuiltIn["Log"](`Loading Django admin: ${str(V.BASIC_DJANGO_ADMIN_FULLNAME)}`);
    V.DJANGO_ADMIN_EMAIL = V.BASIC_DJANGO_ADMIN_EMAIL;
    V.DJANGO_ADMIN_HETU = V.BASIC_DJANGO_ADMIN_HETU;
    V.DJANGO_ADMIN_FIRST_NAME = V.BASIC_DJANGO_ADMIN_FIRSTNAME;
    V.DJANGO_ADMIN_LAST_NAME = V.BASIC_DJANGO_ADMIN_LASTNAME;
    V.DJANGO_ADMIN_FULLNAME = V.BASIC_DJANGO_ADMIN_FULLNAME;
    V.DJANGO_ADMIN_DJANGO_USERNAME = V.BASIC_DJANGO_ADMIN_DJANGO_USERNAME;

    // Set permission target admin based on permission test type (parsed from tags)
    if (str(permission_test_type) === "unit-permissions-test") {
      await BuiltIn["Log"]("Loading permission target admin: Niko Selänne (unit permissions test)");
      V.PERMISSION_TARGET_ADMIN_EMAIL = "qfaksi+niko@gmail.com";
      V.PERMISSION_TARGET_ADMIN_HETU = "150785-907H";
      V.PERMISSION_TARGET_ADMIN_FIRST_NAME = "Niko";
      V.PERMISSION_TARGET_ADMIN_LAST_NAME = "Selänne";
      V.PERMISSION_TARGET_ADMIN_FULLNAME = "Niko Selänne";
    } else if (str(permission_test_type) === "unit-group-permissions-test") {
      await BuiltIn["Log"]("Loading permission target admin: Mikko Mäkinen (unit group permissions test)");
      V.PERMISSION_TARGET_ADMIN_EMAIL = "qfaksi+mikko@gmail.com";
      V.PERMISSION_TARGET_ADMIN_HETU = "200685-907K";
      V.PERMISSION_TARGET_ADMIN_FIRST_NAME = "Mikko";
      V.PERMISSION_TARGET_ADMIN_LAST_NAME = "Mäkinen";
      V.PERMISSION_TARGET_ADMIN_FULLNAME = "Mikko Mäkinen";
    } else {
      // Default: Marika Salminen (general-permissions-test or fallback)
      await BuiltIn["Log"](
        `Loading permission target admin: ${str(V.BASIC_PERMISSION_TARGET_ADMIN_FULLNAME)} (general permissions)`
      );
      V.PERMISSION_TARGET_ADMIN_EMAIL = V.BASIC_PERMISSION_TARGET_ADMIN_EMAIL;
      V.PERMISSION_TARGET_ADMIN_HETU = V.BASIC_PERMISSION_TARGET_ADMIN_HETU;
      V.PERMISSION_TARGET_ADMIN_FIRST_NAME = V.BASIC_PERMISSION_TARGET_ADMIN_FIRSTNAME;
      V.PERMISSION_TARGET_ADMIN_LAST_NAME = V.BASIC_PERMISSION_TARGET_ADMIN_LASTNAME;
      V.PERMISSION_TARGET_ADMIN_FULLNAME = V.BASIC_PERMISSION_TARGET_ADMIN_FULLNAME;
    }

    await BuiltIn["Log"]("✓ Permission test admin variables set (Django admin and permission target)");
  },

  /** Releases the PabotLib value set when test is finished */
  "Release Test Data": async () => {
    let status: RobotValue;
    status = await BuiltIn["Run Keyword And Return Status"](PabotLib["Release Value Set"]);
    if (isTruthy(status)) {
      await BuiltIn["Log"]("✓ Released PabotLib value set");
    } else {
      await BuiltIn["Log"]("No PabotLib value set to release (single user mode or non-parallel execution)");
    }
  },

  /** Sets all regular user variables from the PabotLib value set */
  "Set User Variables From Value Set": async () => {
    let email: RobotValue,
      first_name: RobotValue,
      last_name: RobotValue,
      full_name: RobotValue,
      hetu: RobotValue,
      phone: RobotValue,
      password: RobotValue;
    email = await PabotLib["Get Value From Set"]("CURRENT_USER_EMAIL");
    first_name = await PabotLib["Get Value From Set"]("CURRENT_USER_FIRST_NAME");
    last_name = await PabotLib["Get Value From Set"]("CURRENT_USER_LAST_NAME");
    full_name = await PabotLib["Get Value From Set"]("CURRENT_USER_FULLNAME");
    hetu = await PabotLib["Get Value From Set"]("CURRENT_USER_HETU");
    phone = await PabotLib["Get Value From Set"]("CURRENT_USER_PHONE");
    password = await PabotLib["Get Value From Set"]("CURRENT_PASSWORD");

    V.CURRENT_USER_EMAIL = email;
    V.CURRENT_USER_FIRST_NAME = first_name;
    V.CURRENT_USER_LAST_NAME = last_name;
    V.CURRENT_USER_FULLNAME = full_name;
    V.CURRENT_USER_HETU = hetu;
    V.CURRENT_USER_PHONE = phone;
    V.CURRENT_PASSWORD = password;
  },

  /** Sets all admin user variables from the PabotLib value set */
  "Set Admin Variables From Value Set": async () => {
    let admin_email: RobotValue,
      admin_first_name: RobotValue,
      admin_last_name: RobotValue,
      admin_hetu: RobotValue,
      admin_fullname: RobotValue,
      admin_password: RobotValue;
    admin_email = await PabotLib["Get Value From Set"]("ADMIN_CURRENT_USER_EMAIL");
    admin_first_name = await PabotLib["Get Value From Set"]("ADMIN_CURRENT_USER_FIRST_NAME");
    admin_last_name = await PabotLib["Get Value From Set"]("ADMIN_CURRENT_USER_LAST_NAME");
    admin_hetu = await PabotLib["Get Value From Set"]("ADMIN_CURRENT_USER_HETU");
    admin_fullname = await PabotLib["Get Value From Set"]("ADMIN_CURRENT_USER_FULLNAME");
    admin_password = await PabotLib["Get Value From Set"]("ADMIN_CURRENT_USER_PASSWORD");

    V.ADMIN_CURRENT_USER_EMAIL = admin_email;
    V.ADMIN_CURRENT_USER_FIRST_NAME = admin_first_name;
    V.ADMIN_CURRENT_USER_LAST_NAME = admin_last_name;
    V.ADMIN_CURRENT_USER_HETU = admin_hetu;
    V.ADMIN_CURRENT_USER_FULLNAME = admin_fullname;
    V.ADMIN_CURRENT_USER_PASSWORD = admin_password;
  },

  /**
   * Sets Django admin variables from the PabotLib value set (for permission tests)
   * Password is ONLY read from environment variable DJANGO_ADMIN_PASSWORD
   */
  "Set Django Admin Variables From Value Set": async () => {
    let django_email: RobotValue,
      django_first_name: RobotValue,
      django_last_name: RobotValue,
      django_hetu: RobotValue,
      django_fullname: RobotValue,
      django_username: RobotValue;
    django_email = await PabotLib["Get Value From Set"]("DJANGO_ADMIN_EMAIL");
    django_first_name = await PabotLib["Get Value From Set"]("DJANGO_ADMIN_FIRST_NAME");
    django_last_name = await PabotLib["Get Value From Set"]("DJANGO_ADMIN_LAST_NAME");
    django_hetu = await PabotLib["Get Value From Set"]("DJANGO_ADMIN_HETU");
    django_fullname = await PabotLib["Get Value From Set"]("DJANGO_ADMIN_FULLNAME");
    django_username = await PabotLib["Get Value From Set"]("DJANGO_ADMIN_DJANGO_USERNAME");

    // Password is already available from ${DJANGO_ADMIN_PASSWORD} (loaded by env_loader.py)
    // Always use DJANGO_ADMIN_PASSWORD for all Django admins

    V.DJANGO_ADMIN_EMAIL = django_email;
    V.DJANGO_ADMIN_FIRST_NAME = django_first_name;
    V.DJANGO_ADMIN_LAST_NAME = django_last_name;
    V.DJANGO_ADMIN_HETU = django_hetu;
    V.DJANGO_ADMIN_FULLNAME = django_fullname;
    V.DJANGO_ADMIN_DJANGO_USERNAME = django_username;
  },

  /**
   * Sets permission target admin variables from the PabotLib value set (for permission tests)
   * These are the admin user whose permissions will be modified
   */
  "Set Permission Target Admin Variables From Value Set": async () => {
    let target_email: RobotValue,
      target_first_name: RobotValue,
      target_last_name: RobotValue,
      target_hetu: RobotValue,
      target_fullname: RobotValue,
      target_username: RobotValue;
    target_email = await PabotLib["Get Value From Set"]("PERMISSION_TARGET_ADMIN_EMAIL");
    target_first_name = await PabotLib["Get Value From Set"]("PERMISSION_TARGET_ADMIN_FIRST_NAME");
    target_last_name = await PabotLib["Get Value From Set"]("PERMISSION_TARGET_ADMIN_LAST_NAME");
    target_hetu = await PabotLib["Get Value From Set"]("PERMISSION_TARGET_ADMIN_HETU");
    target_fullname = await PabotLib["Get Value From Set"]("PERMISSION_TARGET_ADMIN_FULLNAME");
    target_username = await PabotLib["Get Value From Set"]("PERMISSION_TARGET_DJANGO_USERNAME");

    V.PERMISSION_TARGET_ADMIN_EMAIL = target_email;
    V.PERMISSION_TARGET_ADMIN_FIRST_NAME = target_first_name;
    V.PERMISSION_TARGET_ADMIN_LAST_NAME = target_last_name;
    V.PERMISSION_TARGET_ADMIN_HETU = target_hetu;
    V.PERMISSION_TARGET_ADMIN_FULLNAME = target_fullname;
    V.PERMISSION_TARGET_DJANGO_USERNAME = target_username;

    // =============================================================================
    // MAIL TEST DATA MANAGEMENT (for cross-test data sharing)
    // =============================================================================
  },

  /** Stores mail-related test data for cross-test access */
  "Store Mail Test Data": async (
    reservation_number: RobotValue,
    reservation_time: RobotValue,
    unit_name: RobotValue,
    formatted_start_time: RobotValue,
    formatted_end_time: RobotValue
  ) => {
    let status: RobotValue;
    status = await BuiltIn["Run Keyword And Return Status"](
      PabotLib["Set Parallel Value For Key"],
      "MAIL_RESERVATION_NUMBER",
      reservation_number
    );
    if (isTruthy(status)) {
      await PabotLib["Set Parallel Value For Key"]("MAIL_RESERVATION_TIME", reservation_time);
      await PabotLib["Set Parallel Value For Key"]("MAIL_UNIT_NAME", unit_name);
      await PabotLib["Set Parallel Value For Key"]("MAIL_FORMATTED_START_TIME", formatted_start_time);
      await PabotLib["Set Parallel Value For Key"]("MAIL_FORMATTED_END_TIME", formatted_end_time);
      await BuiltIn["Log"]("✓ Stored mail test data using PabotLib");
    } else {
      V.MAIL_RESERVATION_NUMBER = reservation_number;
      V.MAIL_RESERVATION_TIME = reservation_time;
      V.MAIL_UNIT_NAME = unit_name;
      V.MAIL_FORMATTED_START_TIME = formatted_start_time;
      V.MAIL_FORMATTED_END_TIME = formatted_end_time;
      await BuiltIn["Log"]("✓ Stored mail test data as test variables (fallback)");
    }
  },

  /** Retrieves mail-related test data for verification */
  "Get Mail Test Data": async () => {
    let status: RobotValue,
      reservation_number: RobotValue,
      reservation_time: RobotValue,
      unit_name: RobotValue,
      formatted_start_time: RobotValue,
      formatted_end_time: RobotValue;
    status = await BuiltIn["Run Keyword And Return Status"](
      PabotLib["Get Parallel Value For Key"],
      "MAIL_RESERVATION_NUMBER"
    );
    if (isTruthy(status)) {
      reservation_number = await PabotLib["Get Parallel Value For Key"]("MAIL_RESERVATION_NUMBER");
      reservation_time = await PabotLib["Get Parallel Value For Key"]("MAIL_RESERVATION_TIME");
      unit_name = await PabotLib["Get Parallel Value For Key"]("MAIL_UNIT_NAME");
      formatted_start_time = await PabotLib["Get Parallel Value For Key"]("MAIL_FORMATTED_START_TIME");
      formatted_end_time = await PabotLib["Get Parallel Value For Key"]("MAIL_FORMATTED_END_TIME");
      await BuiltIn["Log"]("✓ Retrieved mail test data using PabotLib");
    } else {
      reservation_number = V.MAIL_RESERVATION_NUMBER ?? "";
      reservation_time = V.MAIL_RESERVATION_TIME ?? "";
      unit_name = V.MAIL_UNIT_NAME ?? "";
      formatted_start_time = V.MAIL_FORMATTED_START_TIME ?? "";
      formatted_end_time = V.MAIL_FORMATTED_END_TIME ?? "";
      await BuiltIn["Log"]("✓ Retrieved mail test data from test variables (fallback)");
    }

    return [reservation_number, reservation_time, unit_name, formatted_start_time, formatted_end_time];

    // =============================================================================
    // BACKWARD COMPATIBILITY KEYWORDS
    // =============================================================================
  },

  /** For value sets, use Set Parallel Value For Key instead */
  "Store Test Data Variable": async (variable_name: RobotValue, value: RobotValue) => {
    let status: RobotValue;
    status = await BuiltIn["Run Keyword And Return Status"](
      PabotLib["Set Parallel Value For Key"],
      variable_name,
      value
    );
    if (isTruthy(status)) {
      await BuiltIn["Log"](`Stored ${str(variable_name)} = ${str(value)} in value set`);
    } else {
      V[variable_name] = value;
      await BuiltIn["Log"](`Stored ${str(variable_name)} = ${str(value)} as test variable (fallback)`);
    }
  },

  /** Gets a variable value from value sets or fallback to suite variable */
  "Get Test Data Variable": async (variable_name: RobotValue, default_value: RobotValue = "") => {
    let status: RobotValue, value: RobotValue;
    await BuiltIn["Log"](`DEBUG: Getting variable '${str(variable_name)}' with default '${str(default_value)}'`);
    status = await BuiltIn["Run Keyword And Return Status"](PabotLib["Get Parallel Value For Key"], variable_name);
    if (isTruthy(status)) {
      value = await PabotLib["Get Parallel Value For Key"](variable_name);
      await BuiltIn["Log"](`DEBUG: PabotLib returned value '${str(value)}' for '${str(variable_name)}'`);
      // If PabotLib returns an empty value, use the default value (key doesn't exist yet)
      if (str(value) === "") {
        await BuiltIn["Log"](
          `DEBUG: PabotLib value was empty (key doesn't exist), using default value '${str(default_value)}' for '${str(variable_name)}'`
        );
        return default_value;
      }
      return value;
    }
    value = V[variable_name] ?? default_value;
    await BuiltIn["Log"](
      `DEBUG: PabotLib not available, using fallback value '${str(value)}' for '${str(variable_name)}'`
    );
    return value;

    // =============================================================================
    // SYNCHRONIZATION KEYWORDS FOR MAIL TEST
    // =============================================================================
  },

  /** Marks that the paid booking test has started execution */
  "Mark Paid Booking Test Started": async () => {
    await parallel_test_data["Store Test Data Variable"]("PAID_BOOKING_STARTED", "True");
    // Port: a Playwright retry starts the test again, so the failure of the previous attempt no longer counts
    await parallel_test_data["Store Test Data Variable"]("PAID_BOOKING_FAILED", "");
    await BuiltIn["Log"]("Marked paid booking test as started");
  },

  /** Marks that the paid booking test has completed successfully */
  "Mark Paid Booking Test Completed": async () => {
    await parallel_test_data["Store Test Data Variable"]("PAID_BOOKING_COMPLETED", "True");
    await BuiltIn["Log"]("Marked paid booking test as completed");
  },

  /** Marks that the paid booking test has failed */
  "Mark Paid Booking Test Failed": async () => {
    // Port: when Playwright will retry the test, the email test waits for the retry instead of skipping.
    // Robot did the same with its rerun of failed and skipped tests at the end of the run.
    // RETRYING is written before FAILED, so the email test never sees FAILED without knowing about the retry.
    const retriesLeft = testInfo().retry < testInfo().project.retries;
    await parallel_test_data["Store Test Data Variable"]("PAID_BOOKING_RETRYING", retriesLeft ? "True" : "");
    await parallel_test_data["Store Test Data Variable"]("PAID_BOOKING_FAILED", "True");
    await BuiltIn["Log"]("Marked paid booking test as failed");
  },

  /** Waits for the paid booking test to complete (success or failure) */
  "Wait For Paid Booking Completion": async (timeout: RobotValue = "300") => {
    let start_check_timeout: RobotValue,
      started: RobotValue,
      current_time: RobotValue,
      end_time: RobotValue,
      check_count: RobotValue,
      start_time: RobotValue,
      elapsed: RobotValue,
      booking_num: RobotValue,
      has_booking_data: RobotValue,
      elapsed_formatted: RobotValue,
      completed: RobotValue,
      failed: RobotValue,
      retrying: RobotValue;
    let retry_noticed = false;
    await BuiltIn["Log"]("Checking if paid booking test has started...");

    // Poll for up to 120 seconds to see if paid booking test starts (accounts for browser setup time)
    start_check_timeout = Date.now() / 1000 + 120;
    started = "";

    while (str(started) === "") {
      current_time = Date.now() / 1000;

      if (Number(current_time) > Number(start_check_timeout)) {
        await BuiltIn["Log"](
          "Paid booking test has not started within 120 seconds - it may not be part of this test run"
        );
        return "NOT_STARTED";
      }

      started = await parallel_test_data["Get Test Data Variable"]("PAID_BOOKING_STARTED", "");
      await BuiltIn["Log"](`DEBUG: PAID_BOOKING_STARTED value: '${str(started)}'`);

      if (str(started) === "") {
        await BuiltIn["Sleep"]("0.5s");
      }
    }

    await BuiltIn["Log"]("Paid booking test has started, now waiting for completion...");

    // Use progressive polling for completion
    end_time = Date.now() / 1000 + Number(timeout);
    check_count = "0";
    start_time = Date.now() / 1000;

    while (true) {
      current_time = Date.now() / 1000;
      elapsed = Number(current_time) - Number(start_time);
      check_count = Number(check_count) + 1;

      if (Number(current_time) > Number(end_time)) {
        await BuiltIn["Log"](`Timeout after ${str(check_count)} checks`);
        return "TIMEOUT";
      }

      // Check for successful completion (BOOKING_NUM_FOR_MAIL is set)
      booking_num = await parallel_test_data["Get Test Data Variable"]("BOOKING_NUM_FOR_MAIL", "");
      has_booking_data = await BuiltIn["Run Keyword And Return Status"](BuiltIn["Should Not Be Empty"], booking_num);

      if (isTruthy(has_booking_data)) {
        elapsed_formatted = Number(elapsed).toFixed(1);
        await BuiltIn["Log"](
          `Test completed successfully after ${str(check_count)} checks (${str(elapsed_formatted)}s)`
        );
        return "COMPLETED";
      }

      // Check if test has explicitly marked completion (even if failed)
      completed = await parallel_test_data["Get Test Data Variable"]("PAID_BOOKING_COMPLETED", "");
      failed = await parallel_test_data["Get Test Data Variable"]("PAID_BOOKING_FAILED", "");
      retrying = await parallel_test_data["Get Test Data Variable"]("PAID_BOOKING_RETRYING", "");

      if (str(completed) === "True") {
        elapsed_formatted = Number(elapsed).toFixed(1);
        await BuiltIn["Log"](`Test marked as completed after ${str(check_count)} checks (${str(elapsed_formatted)}s)`);
        return "COMPLETED";
      } else if (str(failed) === "True" && str(retrying) === "True") {
        // Port: the failed attempt will be retried. Its start clears PAID_BOOKING_FAILED, and a failure
        // of the last attempt clears PAID_BOOKING_RETRYING. Wait for the retry with a fresh timeout.
        if (!retry_noticed) {
          retry_noticed = true;
          end_time = Date.now() / 1000 + Number(timeout);
          await BuiltIn["Log"]("Paid booking test failed and will be retried, waiting for the retry");
        }
      } else if (str(failed) === "True") {
        elapsed_formatted = Number(elapsed).toFixed(1);
        await BuiltIn["Log"](`Test failed after ${str(check_count)} checks (${str(elapsed_formatted)}s)`);
        return "FAILED";
      }

      await BuiltIn["Sleep"]("1s"); // Check every second
    }
  },
});
