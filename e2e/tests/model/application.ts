import { Selector } from 'testcafe';

class Application {
  applicationTemplateName: Selector;

  constructor() {
    this.applicationTemplateName = Selector('[role=heading]');
  }
}

export default new Application();
