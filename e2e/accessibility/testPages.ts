import { axeCheck, createReport } from 'axe-testcafe';
import config from '../config';

const runAxeCheck = async (t) => {
  const { violations } = await axeCheck(t);
  await t.expect(violations.length === 0).ok(createReport(violations));
};

fixture('axe').page(config.BASE_URL);

test('Front page', async (t) => {
  await runAxeCheck(t);
});
