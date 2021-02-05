import home from './model/home';
import search from './model/search';
import application from './model/application';
import config from '../config';

fixture('e2e test poc').page(config.BASE_URL);

/** A Dummy e2e test, TODO once some part of the application starts to maturize: add e2e tests */
test('Start new application', async (t) => {
  await t
    .click(home.browseAllButton)
    .typeText(search.searchText, 'Studio')
    .click(search.searchButton)
    .click(search.selectReservationUnitButton)
    .click(search.startApplicationButton)
    .click(application.addApplicationEventButton)
    .expect(application.applicationTemplateName.textContent)
    .eql('Nimetön vakiovuoro');
});
