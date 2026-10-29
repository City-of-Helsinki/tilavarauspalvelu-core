/**
 * Shared user data. The testData fixture (TestSuites/test-data.ts) uses these users:
 * - in sequential mode (FORCE_SINGLE_USER=True or one worker), where all tests share them
 * - in tests without a data set tag, like the notification tests
 * In parallel runs, the other tests get their own users from pabot_users.dat.
 */

function withFullName<T extends { firstName: string; lastName: string }>(person: T): T & { fullName: string } {
  return { ...person, fullName: `${person.firstName} ${person.lastName}` };
}

export const BASIC_USER_MALE = withFullName({
  // qfaksi+ande@gmail.com
  email: "django_email_robot@mailiposti.com",
  hetu: "180674-907T",
  phone: "+35840123654",
  firstName: "Ande",
  lastName: "AutomaatioTesteri",
  password: "AutomaatioTesteri",
});

export const BASIC_ADMIN_MALE = withFullName({
  email: "qfaksi+tirehtoori@gmail.com",
  hetu: "120869-9332",
  firstName: "Tirehtoori",
  lastName: "Tötterstrom",
  password: "Tötterstrom",
});

export const BASIC_DJANGO_ADMIN = withFullName({
  email: "qfaksi+kari@gmail.com",
  hetu: "150875-9345",
  firstName: "Kari",
  lastName: "Kekkonen",
  password: "Kekkonen",
  djangoUsername: "u-synoynteknhu5f4oky5komlxz4",
});

export const BASIC_PERMISSION_TARGET_ADMIN = withFullName({
  email: "qfaksi+marika@gmail.com",
  hetu: "140785-932R",
  phone: "+35840123669",
  firstName: "Marika",
  lastName: "Salminen",
});

export const USERMAIL_EMAIL = "qfaksi@gmail.com";
