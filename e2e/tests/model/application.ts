import { Selector } from 'testcafe';

export default {
  applicationTemplateName: Selector('[role=heading]'),
  addApplicationEventButton: Selector('#addApplicationEvent'),
  page1: {
    applicationEventAccordion: Selector('form > div > div > button'),
    applicationEventNameInput: Selector('#applicationEvents[0].name'),
    numPersonsInput: Selector('#applicationEvents\\[0\\]\\.numPersons'),
    defaultPeriodCheckbox: Selector('#defaultPeriod'),
    beginInput: Selector('#applicationEvents\\[0\\]\\.begin'),
    endInput: Selector('#applicationEvents\\[0\\]\\.end'),
    nextButton: Selector('#next'),
  },
  page2: {
    applicationEventAccordion: Selector('form > div > div > button'),
  },
};
