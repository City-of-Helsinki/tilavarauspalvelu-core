/**
 * Robot's `Suite Setup    Run Only Once    create_data.Create Robot Test Data`: the suites depend on this
 * project, so the test data is created once per run before any of them start.
 */
import { testWithoutBrowser as test } from "../lib/robot";
import { Pages } from "./pages";

test("Run Only Once    create_data.Create Robot Test Data", async () => {
  await new Pages().createData.createRobotTestData();
});
