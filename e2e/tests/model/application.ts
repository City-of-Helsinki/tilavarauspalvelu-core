import { Selector } from 'testcafe';
import { random } from '../../config';

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
    applicationEventAccordion: Selector(
      'div.Accordion-module_accordionHeader__3_uK7 > button'
    ),
    randomApplicationEventScheduleButton: (): Selector => {
      const rnd = random.randomInt(7 * 17);
      const button = Selector(`[role=region] > div > div > button`);
      return button.nth(rnd);
    },
    nextButton: Selector('#next'),
  },
};
