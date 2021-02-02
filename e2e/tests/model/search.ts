import { Selector } from 'testcafe';

class Home {
  searchText: Selector;

  searchButton: Selector;

  firstResultsearchButton: Selector;

  selectReservationUnitButton: Selector;

  startApplicationButton: Selector;

  constructor() {
    this.searchText = Selector('#search');
    this.searchButton = Selector('#searchButton');
    this.selectReservationUnitButton = Selector(
      'main > div > div:nth-child(1) > div > button'
    );
    this.startApplicationButton = Selector('#startApplicationButton');
  }
}

export default new Home();
