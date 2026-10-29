/** Suite-specific units for parallel test execution. The testData fixture picks them by the suite tag (test-data.ts). */

/** Desktop browser tests, and the admin tests */
export const DESKTOP_UNITS = {
  alwaysFreeUnit: "Maksuton Mankeli (AUTOMAATIOTESTI ÄLÄ POISTA)",
  alwaysFreeUnitWithLocation: "Maksuton Mankeli (AUTOMAATIOTESTI ÄLÄ POISTA), Harakka, piilokoju",
  alwaysPaidUnit: "Aina maksullinen Aitio (AUTOMAATIOTESTI ÄLÄ POISTA)",
  alwaysPaidUnitWithLocation: "Aina maksullinen Aitio (AUTOMAATIOTESTI ÄLÄ POISTA), Harakka, piilokoju",
  alwaysPaidUnitSubvented: "Alennuskelpoinen aula (AUTOMAATIOTESTI ÄLÄ POISTA)",
  alwaysPaidUnitSubventedWithLocation: "Alennuskelpoinen aula (AUTOMAATIOTESTI ÄLÄ POISTA), Harakka, piilokoju",
  freeUnitNoCancel: "Perumiskelvoton parveke, maksuton (AUTOMAATIOTESTI ÄLÄ POISTA)",
  freeUnitNoCancelWithLocation: "Perumiskelvoton parveke, maksuton (AUTOMAATIOTESTI ÄLÄ POISTA), Harakka, piilokoju",
  unitWithAccessCode: "Ovikoodi maksuton käsiteltävä (AUTOMAATIOTESTI ÄLÄ POISTA)",
  unitWithAccessCodeWithLocation: "Ovikoodi maksuton käsiteltävä (AUTOMAATIOTESTI ÄLÄ POISTA), Harakka, piilokoju",
  unavailableUnit: "Aina varattu yksikkö (AUTOMAATIOTESTI ÄLÄ POISTA)",
  unavailableUnitWithLocation: "Aina varattu yksikkö (AUTOMAATIOTESTI ÄLÄ POISTA), Harakka, piilokoju",
};

/** The tests where a customer books and an admin handles the booking */
export const COMBINED_UNITS = {
  alwaysPaidUnitSubvented: "Alennuskelpoinen aula (AUTOMAATIOTESTI ÄLÄ POISTA)",
  alwaysPaidUnitSubventedWithLocation: "Alennuskelpoinen aula (AUTOMAATIOTESTI ÄLÄ POISTA), Harakka, piilokoju",
  unitRequiresAlwaysHandling: "Aina käsiteltävä kellarikerros (AUTOMAATIOTESTI ÄLÄ POISTA)",
  unitRequiresAlwaysHandlingWithLocation:
    "Aina käsiteltävä kellarikerros (AUTOMAATIOTESTI ÄLÄ POISTA), Harakka, piilokoju",
};

/** The units' copies for the Android tests */
export const ANDROID_UNITS = {
  alwaysFreeUnit: "Maksuton Mankeli (AUTOMAATIOTESTI ÄLÄ POISTA) (android)",
  alwaysFreeUnitWithLocation: "Maksuton Mankeli (AUTOMAATIOTESTI ÄLÄ POISTA) (android), Harakka, piilokoju",
  alwaysPaidUnit: "Aina maksullinen Aitio (AUTOMAATIOTESTI ÄLÄ POISTA) (android)",
  alwaysPaidUnitWithLocation: "Aina maksullinen Aitio (AUTOMAATIOTESTI ÄLÄ POISTA) (android), Harakka, piilokoju",
  unitWithAccessCode: "Ovikoodi maksuton käsiteltävä (AUTOMAATIOTESTI ÄLÄ POISTA) (android)",
  unitWithAccessCodeWithLocation:
    "Ovikoodi maksuton käsiteltävä (AUTOMAATIOTESTI ÄLÄ POISTA) (android), Harakka, piilokoju",
  alwaysPaidUnitSubvented: "Alennuskelpoinen aula (AUTOMAATIOTESTI ÄLÄ POISTA) (android)",
  alwaysPaidUnitSubventedWithLocation:
    "Alennuskelpoinen aula (AUTOMAATIOTESTI ÄLÄ POISTA) (android), Harakka, piilokoju",
  unitRequiresAlwaysHandling: "Aina käsiteltävä kellarikerros (AUTOMAATIOTESTI ÄLÄ POISTA) (android)",
  unitRequiresAlwaysHandlingWithLocation:
    "Aina käsiteltävä kellarikerros (AUTOMAATIOTESTI ÄLÄ POISTA) (android), Harakka, piilokoju",
};

/** The units' copies for the iPhone tests */
export const IPHONE_UNITS = {
  alwaysFreeUnit: "Maksuton Mankeli (AUTOMAATIOTESTI ÄLÄ POISTA) (iphone)",
  alwaysFreeUnitWithLocation: "Maksuton Mankeli (AUTOMAATIOTESTI ÄLÄ POISTA) (iphone), Harakka, piilokoju",
  alwaysPaidUnit: "Aina maksullinen Aitio (AUTOMAATIOTESTI ÄLÄ POISTA) (iphone)",
  alwaysPaidUnitWithLocation: "Aina maksullinen Aitio (AUTOMAATIOTESTI ÄLÄ POISTA) (iphone), Harakka, piilokoju",
  unitWithAccessCode: "Ovikoodi maksuton käsiteltävä (AUTOMAATIOTESTI ÄLÄ POISTA) (iphone)",
  unitWithAccessCodeWithLocation:
    "Ovikoodi maksuton käsiteltävä (AUTOMAATIOTESTI ÄLÄ POISTA) (iphone), Harakka, piilokoju",
  alwaysPaidUnitSubvented: "Alennuskelpoinen aula (AUTOMAATIOTESTI ÄLÄ POISTA) (iphone)",
  alwaysPaidUnitSubventedWithLocation:
    "Alennuskelpoinen aula (AUTOMAATIOTESTI ÄLÄ POISTA) (iphone), Harakka, piilokoju",
  unitRequiresAlwaysHandling: "Aina käsiteltävä kellarikerros (AUTOMAATIOTESTI ÄLÄ POISTA) (iphone)",
  unitRequiresAlwaysHandlingWithLocation:
    "Aina käsiteltävä kellarikerros (AUTOMAATIOTESTI ÄLÄ POISTA) (iphone), Harakka, piilokoju",
};
