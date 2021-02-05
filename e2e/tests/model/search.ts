import { Selector } from 'testcafe';

export default {
  searchText: Selector('#search'),
  searchButton: Selector('#searchButton'),
  selectReservationUnitButton: Selector(
    '#searchResultList > div > div:nth-child(1) > div > button'
  ),
  reservationUnitPageLink: Selector(
    '#searchResultList > div > div:nth-child(1) > div > span > a'
  ),
  startApplicationButton: Selector('#startApplicationButton'),
};
