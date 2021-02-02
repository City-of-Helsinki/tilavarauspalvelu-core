import { axeCheck, createReport } from 'axe-testcafe';
import config from '../config';
import home from '../tests/model/home';
import search from '../tests/model/search';

const runAxeCheck = async (t) => {
  const { violations } = await axeCheck(t);
  await t.expect(violations.length === 0).ok(createReport(violations));
};

fixture('axe').page(config.BASE_URL);

test('Front page', async (t) => {
  await runAxeCheck(t);
});

test('Search page', async (t) => {
  await t.click(home.browseAllButton);
  await runAxeCheck(t);
  await t.typeText(search.searchText, 'Studio').click(search.searchButton);
  await runAxeCheck(t);
});

test('Reservation unit page', async (t) => {
  await t.click(home.browseAllButton);
  await t.click(search.searchButton);
  await t.click(search.reservationUnitPageLink);
  await runAxeCheck(t);
});
