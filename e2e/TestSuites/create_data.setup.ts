/**
 * Robot's `Suite Setup    Run Only Once    create_data.Create Robot Test Data`: the suites depend on this
 * project, so the test data is created once per run before any of them start.
 */
import { test } from "../lib/robot";
import { create_data } from "./Resources/create_data";

test("Run Only Once    create_data.Create Robot Test Data", async () => {
  await create_data["Create Robot Test Data"]();
});
