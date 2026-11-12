/**
 * Creates the test data once per run. The suites' projects, all but the notification suite's, depend on this one, so
 * it runs before them.
 */
import { testWithoutBrowser as test } from "../lib/runtime";
import { Pages } from "./pages";

test("Run Only Once    create_data.Create Robot Test Data", async () => {
  await new Pages().createData.createRobotTestData();
});
