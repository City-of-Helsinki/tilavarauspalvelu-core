/**
 * The test users of the parallel runs. A test's data set tag picks its set (TestSuites/test-data.ts), and one test at a
 * time uses a set. In sequential mode (FORCE_SINGLE_USER=True or one worker, like the notification suite's run) and in
 * tests without a data set tag, the tests use the shared users of serial_users.ts instead.
 */
import { ROBOT_EMAIL } from "./variables";

/** The device of a customer project: it picks the user of a customer data set and the copies of the units */
export const PLATFORMS = ["desktop", "android", "iphone"] as const;
export type Platform = (typeof PLATFORMS)[number];

export interface Person {
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  hetu: string;
}

/** The customer who books */
export interface User extends Person {
  phone: string;
  password: string;
}

/** The admin of the admin UI */
export interface Admin extends Person {
  password: string;
}

/** The Django admin of the permission tests, and the admin whose permissions they change */
export interface DjangoUser extends Person {
  djangoUsername: string;
}

/** An admin test's users: the admin, or in a permission test the Django admin and the admin whose permissions change */
export interface AdminDataSet {
  admin?: Admin;
  djangoAdmin?: DjangoUser;
  permissionTarget?: DjangoUser;
}

/** A test where a customer books and an admin handles the booking */
export interface CombinedDataSet {
  user: User;
  admin: Admin;
}

/**
 * The customer data sets. A test has a `@user-data-set-N` tag, and the platform of the project that runs it picks the
 * set's user, so one test serves the desktop and the phones, each with a user of its own. A test that runs on a
 * platform the set has no user for fails.
 */
export const USER_DATA_SETS: Record<string, Partial<Record<Platform, User>>> = {
  // TEST: "User logs in and out with suomi_fi"
  // DESCRIPTION: Basic login/logout smoke test
  "user-data-set-0": {
    desktop: {
      // Old email: qfaksi+ande@gmail.com
      // Django username: u-5ubvcxgrxzdf5nj7y4sbjnvyeq
      email: ROBOT_EMAIL,
      hetu: "180674-907T",
      phone: "+35840123654",
      firstName: "Ande",
      lastName: "AutomaatioTesteri",
      fullName: "Ande AutomaatioTesteri",
      password: "AutomaatioTesteri",
    },
    android: {
      // Old email: qfaksi+anna@gmail.com
      // Django username: u-ie2b7oqmcvdhjd456rcm7x7tuy
      email: ROBOT_EMAIL,
      hetu: "050576-932R",
      phone: "+35840123673",
      firstName: "Anna",
      lastName: "Korhonen",
      fullName: "Anna Korhonen",
      password: "Korhonen",
    },
    iphone: {
      // Old email: qfaksi+tuula@gmail.com
      // Django username: u-buahccmtg5dedcvalbogbmiktq
      email: ROBOT_EMAIL,
      hetu: "180685-934T",
      phone: "+35840123679",
      firstName: "Tuula",
      lastName: "Aaltonen",
      fullName: "Tuula Aaltonen",
      password: "Aaltonen",
    },
  },
  // TEST: "User can make free single booking and modifies it"
  // DESCRIPTION: Free booking creation, modification, and cancellation
  "user-data-set-1": {
    desktop: {
      // Old email: qfaksi+mikael@gmail.com
      // Django username: u-os5gt6upb5echkmmocu6g2ujr4
      email: ROBOT_EMAIL,
      hetu: "150382-901W",
      phone: "+35840123655",
      firstName: "Mikael",
      lastName: "Virtanen",
      fullName: "Mikael Virtanen",
      password: "Virtanen",
    },
    android: {
      // Old email: qfaksi+mari@gmail.com
      // Django username: u-ggoljyfcwbf27i53qwzjq55rya
      email: ROBOT_EMAIL,
      hetu: "240189-938D",
      phone: "+35840123674",
      firstName: "Mari",
      lastName: "Leppänen",
      fullName: "Mari Leppänen",
      password: "Leppänen",
    },
    iphone: {
      // Old email: qfaksi+merja@gmail.com
      // Django username: u-d7wshr3wqrfsdjcyprfvklq3lu
      email: ROBOT_EMAIL,
      hetu: "250792-936H",
      phone: "+35840123680",
      firstName: "Merja",
      lastName: "Kangas",
      fullName: "Merja Kangas",
      password: "Kangas",
    },
  },
  // TEST: "User can create non-cancelable booking"
  // DESCRIPTION: Non-cancelable booking test
  "user-data-set-2": {
    desktop: {
      // Old email: qfaksi+jukka@gmail.com
      // Django username: u-3fvnhmmwe5hg7alebt4caji7zi
      email: ROBOT_EMAIL,
      hetu: "220990-903Y",
      phone: "+35840123656",
      firstName: "Jukka",
      lastName: "Korhonen",
      fullName: "Jukka Korhonen",
      password: "Korhonen",
    },
  },
  // TEST: "User can make paid single booking with interrupted checkout"
  // DESCRIPTION: Paid booking with payment interruption
  "user-data-set-3": {
    desktop: {
      // Old email: qfaksi+petri@gmail.com
      // Django username: u-754c5vvdzzbk5jgsjfh5hcfzc4
      email: ROBOT_EMAIL,
      hetu: "070785-905A",
      phone: "+35840123657",
      firstName: "Petri",
      lastName: "Makinen",
      fullName: "Petri Makinen",
      password: "Makinen",
    },
    android: {
      // Old email: qfaksi+kaisa@gmail.com
      // Django username: u-xabra2s6gbgf5nh7ss46gbsblq
      email: ROBOT_EMAIL,
      hetu: "121287-938M",
      phone: "+35840123676",
      firstName: "Kaisa",
      lastName: "Rantanen",
      fullName: "Kaisa Rantanen",
      password: "Rantanen",
    },
    iphone: {
      // Old email: qfaksi+seija@gmail.com
      // Django username: u-a73qe2rmajavvmpb2kvwdcjajq
      email: ROBOT_EMAIL,
      hetu: "141279-932S",
      phone: "+35840123682",
      firstName: "Seija",
      lastName: "Mäenpää",
      fullName: "Seija Mäenpää",
      password: "Mäenpää",
    },
  },
  // TEST: "User can make paid single booking"
  // DESCRIPTION: Standard paid booking with email verification
  "user-data-set-4": {
    desktop: {
      // Old email: qfaksi+antti@gmail.com
      // Django username: u-4ghz53zzivd4bnpo6x7ef57q4q
      email: ROBOT_EMAIL,
      hetu: "111276-907U",
      phone: "+35840123658",
      firstName: "Antti",
      lastName: "Nieminen",
      fullName: "Antti Nieminen",
      password: "Nieminen",
    },
    android: {
      // Old email: qfaksi+elina@gmail.com
      // Django username: u-3ubdbnexc5cotcl623jagjbzni
      email: ROBOT_EMAIL,
      hetu: "131188-936A",
      phone: "+35840123661",
      firstName: "Elina",
      lastName: "Laine",
      fullName: "Elina Laine",
      password: "Laine",
    },
    iphone: {
      // Old email: qfaksi+helena@gmail.com
      // Django username: u-b6phfq5wmbcjljuqoveb3mqsni
      email: ROBOT_EMAIL,
      hetu: "081184-938K",
      phone: "+35840123681",
      firstName: "Helena",
      lastName: "Hiltunen",
      fullName: "Helena Hiltunen",
      password: "Hiltunen",
    },
  },
  // TEST: "User can make subvented single booking that requires handling"
  // DESCRIPTION: Subvented booking requiring manual handling
  "user-data-set-5": {
    desktop: {
      // Old email: qfaksi+matti@gmail.com
      // Django username: u-crag6mljcfgtthi4y2eflvmk4i
      email: ROBOT_EMAIL,
      hetu: "040689-907H",
      phone: "+35840123659",
      firstName: "Matti",
      lastName: "Mäkelä",
      fullName: "Matti Mäkelä",
      password: "Mäkelä",
    },
    android: {
      // Old email: qfaksi+riitta@gmail.com
      // Django username: u-lj6ejffcxbcn3j6lnpjjz2x5oe
      email: ROBOT_EMAIL,
      hetu: "300474-932P",
      phone: "+35840123678",
      firstName: "Riitta",
      lastName: "Lindström",
      fullName: "Riitta Lindström",
      password: "Lindström",
    },
    iphone: {
      // Old email: qfaksi+liisa@gmail.com
      // Django username: u-jtvjms5shnhpbplyknv7jcac4q
      email: ROBOT_EMAIL,
      hetu: "070591-934B",
      phone: "+35840123684",
      firstName: "Liisa",
      lastName: "Koivisto",
      fullName: "Liisa Koivisto",
      password: "Koivisto",
    },
  },
  // TEST: "User can make booking that requires handling"
  // DESCRIPTION: Mobile Android booking requiring handling
  "user-data-set-6": {
    android: {
      // Old email: qfaksi+ulla@gmail.com
      // Django username: u-fxwut2vtubfuxpnmbqdjpqmwou
      email: ROBOT_EMAIL,
      hetu: "030888-932N",
      phone: "+35840123677",
      firstName: "Ulla",
      lastName: "Hakala",
      fullName: "Ulla Hakala",
      password: "Hakala",
    },
    iphone: {
      // Old email: qfaksi+maija@gmail.com
      // Django username: u-bqawevrs2vbhniuprp3wdfv2gu
      email: ROBOT_EMAIL,
      hetu: "230986-934L",
      phone: "+35840123683",
      firstName: "Maija",
      lastName: "Peltonen",
      fullName: "Maija Peltonen",
      password: "Peltonen",
    },
  },
  // TEST: "User checks that reserved time is not available anymore"
  // DESCRIPTION: Time availability verification test
  "user-data-set-7": {
    desktop: {
      // Old email: qfaksi+sanna@gmail.com
      // Django username: u-eplnxl7s3baungvx4cvjsjb6ge
      email: ROBOT_EMAIL,
      hetu: "250592-934X",
      phone: "+35840123660",
      firstName: "Sanna",
      lastName: "Hämäläinen",
      fullName: "Sanna Hämäläinen",
      password: "Hämäläinen",
    },
  },
  // TEST: "User checks that there are not current dates in the past bookings"
  // DESCRIPTION: Past bookings validation
  "user-data-set-8": {
    desktop: {
      // Old email: qfaksi+paivi@gmail.com
      // Django username: u-uslsa3ewcvcmbcfyub5b26lfmu
      email: ROBOT_EMAIL,
      hetu: "160691-936L",
      phone: "+35840123675",
      firstName: "Päivi",
      lastName: "Mustonen",
      fullName: "Päivi Mustonen",
      password: "Mustonen",
    },
  },
  // TEST: "User can make free single booking and check info from downloaded calendar file"
  // DESCRIPTION: Calendar file download and verification
  "user-data-set-9": {
    desktop: {
      // Old email: qfaksi+kirsi@gmail.com
      // Django username: u-3zqtvhpzhbevrdcej7prbobe2i
      email: ROBOT_EMAIL,
      hetu: "030679-938F",
      phone: "+35840123662",
      firstName: "Kirsi",
      lastName: "Heikkinen",
      fullName: "Kirsi Heikkinen",
      password: "Heikkinen",
    },
  },
  // TEST: "Check emails from reservations"
  // DESCRIPTION: Email verification for reservation workflows
  "user-data-set-10": {
    desktop: {
      // Old email: qfaksi+marja@gmail.com
      // Django username: u-lelgrutpxffxra7r6z7cmc5ksu
      email: ROBOT_EMAIL,
      hetu: "290384-932W",
      phone: "+35840123663",
      firstName: "Marja",
      lastName: "Koskinen",
      fullName: "Marja Koskinen",
      password: "Koskinen",
    },
  },
  // TEST: "User makes recurring reservation"
  // DESCRIPTION: Recurring reservation application
  "user-data-set-11": {
    desktop: {
      // Old email: qfaksi+tiina@gmail.com
      // Django username: u-n76joq6monajzlqxzoff4ore4i
      email: ROBOT_EMAIL,
      hetu: "180293-934P",
      phone: "+35840123664",
      firstName: "Tiina",
      lastName: "Järvinen",
      fullName: "Tiina Järvinen",
      password: "Järvinen",
    },
  },
};

/** The admin data sets, by their `@admin-test-data-set-N` tag */
export const ADMIN_DATA_SETS: Record<string, AdminDataSet> = {
  // TEST: "Admin logs in with suomi_fi"
  // DESCRIPTION: Admin login verification
  "admin-test-data-set-0": {
    admin: {
      // Old email: qfaksi+tirehtoori@gmail.com
      // Django username: u-j7tps34mlvhzhkr4zgq5hltxhu
      email: ROBOT_EMAIL,
      hetu: "120869-9332",
      firstName: "Tirehtoori",
      lastName: "Tötterstrom",
      fullName: "Tirehtoori Tötterstrom",
      password: "Tötterstrom",
    },
  },
  // TEST: "Admin verifies all reservation types and verifies no unavailable reservations exist"
  // DESCRIPTION: Admin reservation verification
  "admin-test-data-set-1": {
    admin: {
      // Old email: qfaksi+pekka@gmail.com
      // Django username: u-smv3dohm6jhf5dt2fpvpqvsitu
      email: ROBOT_EMAIL,
      hetu: "220685-934K",
      firstName: "Pekka",
      lastName: "Virtanen",
      fullName: "Pekka Virtanen",
      password: "Virtanen",
    },
  },
  // TEST: "Admin checks permissions" (Tests_admin_desktop_FI.spec.ts)
  // DESCRIPTION: Django admin modifies admin user's permissions to notification manager role
  "admin-test-data-set-2": {
    // Django admin who performs the permission changes
    // NOTE: Password is read from DJANGO_ADMIN_PASSWORD environment variable
    djangoAdmin: {
      // Old email: qfaksi+kari@gmail.com
      email: ROBOT_EMAIL,
      hetu: "150875-9345",
      firstName: "Kari",
      lastName: "Kekkonen",
      fullName: "Kari Kekkonen",
      djangoUsername: "u-synoynteknhu5f4oky5komlxz4",
    },
    // Permission target admin - the admin whose permissions are being modified
    permissionTarget: {
      email: "qfaksi+marika@gmail.com",
      hetu: "140785-932R",
      firstName: "Marika",
      lastName: "Salminen",
      fullName: "Marika Salminen",
      djangoUsername: "u-ftm3qi35knfdxoysmn24qpz3ce",
    },
  },
  // TEST: "Admin checks unit permissions" (Tests_admin_desktop_FI.spec.ts)
  // DESCRIPTION: Django admin modifies admin user's unit permissions
  "admin-test-data-set-3": {
    // Django admin who performs the permission changes
    // NOTE: Password is read from DJANGO_ADMIN_PASSWORD environment variable
    djangoAdmin: {
      // Old email: qfaksi+ari@gmail.com
      email: ROBOT_EMAIL,
      hetu: "190684-907F",
      firstName: "Ari",
      lastName: "Laine",
      fullName: "Ari Laine",
      djangoUsername: "u-6gyudis5vrex7eoyoofsyg7e7m",
    },
    // Permission target admin - the admin whose permissions are being modified
    // NOTE: This user must have unit permissions set by default (set in data setup phase)
    permissionTarget: {
      email: "qfaksi+niko@gmail.com",
      hetu: "150785-907H",
      firstName: "Niko",
      lastName: "Selänne",
      fullName: "Niko Selänne",
      djangoUsername: "u-hzt64qcjsbb2lnmk7li7tqc4ve",
    },
  },
  // TEST: "Admin checks group unit permissions" (Tests_admin_desktop_FI.spec.ts)
  // DESCRIPTION: Django admin modifies admin user's unit group permissions
  "admin-test-data-set-4": {
    // Django admin who performs the permission changes
    // NOTE: Password is read from DJANGO_ADMIN_PASSWORD environment variable
    djangoAdmin: {
      // Old email: qfaksi+nieminen@gmail.com
      email: ROBOT_EMAIL,
      hetu: "160776-934M",
      firstName: "Timo",
      lastName: "Nieminen",
      fullName: "Timo Nieminen",
      djangoUsername: "u-ztjwmkfnabdghga73muxgh7bua",
    },
    // Permission target admin - the admin whose permissions are being modified
    // NOTE: This user must have unit permissions set by default (set in data setup phase)
    permissionTarget: {
      email: "qfaksi+mikko@gmail.com",
      hetu: "200685-907K",
      firstName: "Mikko",
      lastName: "Mäkinen",
      fullName: "Mikko Mäkinen",
      djangoUsername: "u-lloau4zl65c3lpbpgamxa3edoa",
    },
  },
};

/** The data sets of the combined tests, by their `@combined-test-data-set-N` tag */
export const COMBINED_DATA_SETS: Record<string, CombinedDataSet> = {
  // TEST: "User creates and Admin accepts single booking that requires handling"
  // DESCRIPTION: User-admin booking acceptance workflow
  "combined-test-data-set-0": {
    user: {
      // Old email: qfaksi+hannu@gmail.com
      // Django username: u-ueeszbvcujh6tehct5qobqdv44
      email: ROBOT_EMAIL,
      hetu: "101281-907D",
      phone: "+35840123667",
      firstName: "Hannu",
      lastName: "Rantala",
      fullName: "Hannu Rantala",
      password: "Rantala",
    },
    admin: {
      // Old email: qfaksi+seppo@gmail.com
      // Django username: u-k36o5lcn5rg6db23hqlb6jhxn4
      email: ROBOT_EMAIL,
      hetu: "280677-905Y",
      firstName: "Seppo",
      lastName: "Korhonen",
      fullName: "Seppo Korhonen",
      password: "Korhonen",
    },
  },
  // TEST: "User creates and Admin declines single booking that requires handling"
  // DESCRIPTION: User-admin booking decline workflow
  "combined-test-data-set-1": {
    user: {
      // Old email: qfaksi+risto@gmail.com
      // Django username: u-sdgkcz427jgyxg2gawa7qcy74q
      email: ROBOT_EMAIL,
      hetu: "051093-905L",
      phone: "+35840123668",
      firstName: "Risto",
      lastName: "Hakkarainen",
      fullName: "Risto Hakkarainen",
      password: "Hakkarainen",
    },
    admin: {
      // Old email: qfaksi+erkki@gmail.com
      // Django username: u-khucobukjjh67huofgq4xmcopi
      email: ROBOT_EMAIL,
      hetu: "141082-907K",
      firstName: "Erkki",
      lastName: "Nieminen",
      fullName: "Erkki Nieminen",
      password: "Nieminen",
    },
  },
  // TEST: "User can make reservation with access code and admin changes the code"
  // DESCRIPTION: User creates reservation with access code, admin modifies the code
  "combined-test-data-set-2": {
    user: {
      // Old email: qfaksi+tabitah@gmail.com
      // Django username: u-u6rsbwp6hfedrjz4ttdgk36sz4
      email: ROBOT_EMAIL,
      hetu: "090481-9386",
      phone: "+35840123653",
      firstName: "Tabitah",
      lastName: "Testitar",
      fullName: "Tabitah Testitar",
      password: "Testitar",
    },
    admin: {
      // Old email: qfaksi+antero@gmail.com
      // Django username: u-5l6cnmgeandejout7uktzsqgim
      email: ROBOT_EMAIL,
      hetu: "221175-907B",
      firstName: "Antero",
      lastName: "Salonen",
      fullName: "Antero Salonen",
      password: "Salonen",
    },
  },
};

/** Users that no test uses yet, kept for new tests */
export const RESERVE_USERS: Record<string, { user?: User; admin?: Admin }> = {
  // TEST: Reserved for future use
  // DESCRIPTION: Additional admin user data
  "unused-admin-data-set-1": {
    admin: {
      // Old email: qfaksi+pertti@gmail.com
      // Django username: u-j7q3jatunrf2rdria5cjgpcv4u
      email: ROBOT_EMAIL,
      hetu: "120885-934A",
      firstName: "Pertti",
      lastName: "Kallio",
      fullName: "Pertti Kallio",
      password: "Kallio",
    },
  },
  // TEST: Reserved for future use
  // DESCRIPTION: Additional test user data
  "unused-test-data-set-0": {
    user: {
      // Old email: qfaksi+antti@gmail.com
      email: ROBOT_EMAIL,
      hetu: "180892-936M",
      phone: "+35840123688",
      firstName: "Antti",
      lastName: "Koskinen",
      fullName: "Antti Koskinen",
      password: "Koskinen",
    },
  },
  // TEST: Reserved for future use
  // DESCRIPTION: Additional test user data
  "unused-test-data-set-1": {
    user: {
      // Old email: qfaksi+ari@gmail.com
      // Django username: u-6gyudis5vrex7eoyoofsyg7e7m
      email: ROBOT_EMAIL,
      hetu: "190684-907F",
      phone: "+35840123669",
      firstName: "Ari",
      lastName: "Laine",
      fullName: "Ari Laine",
      password: "Laine",
    },
  },
};
