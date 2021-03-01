import { Selector } from 'testcafe';
import { random } from '../../config';

export default {
  applicationTemplateName: Selector('[role=heading]'),
  addApplicationEventButton: Selector('#addApplicationEvent'),
  page1: {
    applicationEventAccordion: Selector('form > div > div > button'),
    applicationEventNameInput: Selector('#applicationEvents[0].name'),
    numPersonsInput: Selector('#applicationEvents\\[0\\]\\.numPersons'),
    ageGroupButton: Selector('#ageGroup-toggle-button'),
    ageGroupOption1: Selector('#ageGroup-item-0'),
    abilityGroupButton: Selector('#abilityGroup-toggle-button'),
    abilityGroupOption1: Selector('#abilityGroup-item-0'),
    purposeButton: Selector('#purpose-toggle-button'),
    purposeOption1: Selector('#purpose-item-0'),
    defaultPeriodCheckbox: Selector('#defaultPeriod'),
    beginInput: Selector('#applicationEvents\\[0\\]\\.begin'),
    endInput: Selector('#applicationEvents\\[0\\]\\.end'),
    nextButton: Selector('#next'),
  },
  page2: {
    applicationEventAccordion: Selector('#timeSelector-0 > div > button'),
    randomApplicationEventScheduleButton: (): Selector => {
      const rnd = random.randomInt(7 * 17);
      const button = Selector(`[role=region] > div > div > button`);
      return button.nth(rnd);
    },
    nextButton: Selector('#next'),
  },
  page3: {
    fillAsIndividual: Selector('[for="individual"]'),
    firstName: Selector('#contactPerson\\.firstName'),
    lastName: Selector('#contactPerson\\.lastName'),
    streetAddress: Selector('#billingAddress\\.streetAddress'),
    postCode: Selector('#billingAddress\\.postCode'),
    city: Selector('#billingAddress\\.city'),
    phoneNumber: Selector('#contactPerson\\.phoneNumber'),
    email: Selector('#contactPerson\\.email'),
    nextButton: Selector('#next'),
  },
  preview: {
    basicInfoAccordion: Selector('#basicInfo > div > button'),
    firstApplicationEventAccordion: Selector(
      '#applicationEvent-0 > div > button'
    ),
    acceptTerms: Selector('[for="preview\\.acceptTermsOfUse"]'),
    sendButton: Selector('#submit'),
  },
};
