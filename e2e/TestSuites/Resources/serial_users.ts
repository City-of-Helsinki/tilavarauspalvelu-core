/**
 * Shared user data. The testData fixture (TestSuites/fixtures.ts) uses these users:
 * - in sequential mode (FORCE_SINGLE_USER=True or one worker), where all tests share them
 * - in tests without a data set tag, like the notification tests
 * In parallel runs, the other tests get their own users from pabot_users.dat.
 */
import { registerVariables, str } from "../../lib/robot";

export const serial_users_variables = {
  CURRENT_USER_EMAIL: "",
  CURRENT_USER_HETU: "",
  CURRENT_USER_PHONE: "",
  CURRENT_USER_FIRST_NAME: "",
  CURRENT_USER_LAST_NAME: "",
  CURRENT_PASSWORD: "",
  ADMIN_CURRENT_USER_EMAIL: "",
  ADMIN_CURRENT_USER_HETU: "",
  ADMIN_CURRENT_USER_FIRST_NAME: "",
  ADMIN_CURRENT_USER_LAST_NAME: "",
  PERMISSION_TARGET_ADMIN_EMAIL: "",
  PERMISSION_TARGET_ADMIN_HETU: "",
  PERMISSION_TARGET_ADMIN_FIRST_NAME: "",
  PERMISSION_TARGET_ADMIN_LAST_NAME: "",
  PERMISSION_TARGET_ADMIN_FULLNAME: "",
  // qfaksi+ande@gmail.com
  BASIC_USER_MALE_EMAIL: "django_email_robot@mailiposti.com",
  BASIC_USER_MALE_HETU: "180674-907T",
  BASIC_USER_MALE_PHONE: "+35840123654",
  BASIC_USER_MALE_FIRSTNAME: "Ande",
  BASIC_USER_MALE_LASTNAME: "AutomaatioTesteri",
  // A getter reads the variables above it in this table, like Robot resolves them
  get BASIC_USER_MALE_FULLNAME() {
    return `${str(this.BASIC_USER_MALE_FIRSTNAME)} ${str(this.BASIC_USER_MALE_LASTNAME)}`;
  },
  BASIC_USER_MALE_PASSWORD: "AutomaatioTesteri",
  BASIC_ADMIN_MALE_EMAIL: "qfaksi+tirehtoori@gmail.com",
  BASIC_ADMIN_MALE_HETU: "120869-9332",
  BASIC_ADMIN_MALE_FIRSTNAME: "Tirehtoori",
  BASIC_ADMIN_MALE_LASTNAME: "Tötterstrom",
  get BASIC_ADMIN_MALE_FULLNAME() {
    return `${str(this.BASIC_ADMIN_MALE_FIRSTNAME)} ${str(this.BASIC_ADMIN_MALE_LASTNAME)}`;
  },
  BASIC_ADMIN_MALE_PASSWORD: "Tötterstrom",
  BASIC_DJANGO_ADMIN_EMAIL: "qfaksi+kari@gmail.com",
  BASIC_DJANGO_ADMIN_HETU: "150875-9345",
  BASIC_DJANGO_ADMIN_FIRSTNAME: "Kari",
  BASIC_DJANGO_ADMIN_LASTNAME: "Kekkonen",
  get BASIC_DJANGO_ADMIN_FULLNAME() {
    return `${str(this.BASIC_DJANGO_ADMIN_FIRSTNAME)} ${str(this.BASIC_DJANGO_ADMIN_LASTNAME)}`;
  },
  BASIC_DJANGO_ADMIN_PASSWORD: "Kekkonen",
  BASIC_DJANGO_ADMIN_DJANGO_USERNAME: "u-synoynteknhu5f4oky5komlxz4",
  BASIC_PERMISSION_TARGET_ADMIN_EMAIL: "qfaksi+marika@gmail.com",
  BASIC_PERMISSION_TARGET_ADMIN_HETU: "140785-932R",
  BASIC_PERMISSION_TARGET_ADMIN_PHONE: "+35840123669",
  BASIC_PERMISSION_TARGET_ADMIN_FIRSTNAME: "Marika",
  BASIC_PERMISSION_TARGET_ADMIN_LASTNAME: "Salminen",
  get BASIC_PERMISSION_TARGET_ADMIN_FULLNAME() {
    return `${str(this.BASIC_PERMISSION_TARGET_ADMIN_FIRSTNAME)} ${str(this.BASIC_PERMISSION_TARGET_ADMIN_LASTNAME)}`;
  },
  USERMAIL_EMAIL: "qfaksi@gmail.com",
};
registerVariables(serial_users_variables);
