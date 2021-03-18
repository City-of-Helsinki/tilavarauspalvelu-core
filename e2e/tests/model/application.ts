import { Selector } from 'testcafe';
import { random } from '../../config';

export default {
  intro: {
    startApplication: Selector('#start'),
  },
  applicationTemplateName: Selector('[role=heading]'),
  addApplicationEventButton: Selector('#addApplicationEvent'),
  page1: {
    applicationEventAccordion: Selector('form > div > div > button'),
    applicationEventNameInput: Selector('#applicationEvents[0].name'),
    numPersonsInput: Selector('#applicationEvents\\[0\\]\\.numPersons'),
    ageGroupButton: Selector(
      '#applicationEvents\\[0\\]\\.ageGroupId-toggle-button'
    ),
    ageGroupOption1: Selector('#applicationEvents\\[0\\]\\.ageGroupId-item-0'),
    abilityGroupButton: Selector(
      '#applicationEvents\\[0\\]\\.abilityGroupId-toggle-button'
    ),
    abilityGroupOption1: Selector(
      '#applicationEvents\\[0\\]\\.abilityGroupId-item-0'
    ),
    purposeButton: Selector(
      '#applicationEvents\\[0\\]\\.purposeId-toggle-button'
    ),
    purposeOption1: Selector('#applicationEvents\\[0\\]\\.purposeId-item-0'),
    defaultPeriodCheckbox: Selector('#defaultPeriod'),
    beginInput: Selector('#applicationEvents\\[0\\]\\.begin'),
    endInput: Selector('#applicationEvents\\[0\\]\\.end'),
    saveButton: Selector('#applicationEvents\\[0\\]\\.save'),
    nextButton: Selector('#next'),
  },
  page2: {
    randomApplicationEventScheduleButton: (): Selector => {
      const rnd = random.randomInt(7 * 17);
      const button = Selector(`#timeSelector-0 > div > div > button`);
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
    acceptTerms: Selector('[for="preview\\.acceptTermsOfUse"]'),
    sendButton: Selector('#submit'),
  },
};
