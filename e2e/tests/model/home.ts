import { Selector } from 'testcafe';

class Home {
  browseAllButton: Selector;

  constructor() {
    this.browseAllButton = Selector('#browseAllButton');
  }
}

export default new Home();
