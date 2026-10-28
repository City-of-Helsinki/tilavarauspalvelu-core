/**
 * FORCE_SINGLE_USER=True runs the suite in sequential mode, where every test uses the shared users of serial_users
 * (see the testData fixture in TestSuites/fixtures.ts).
 */
import { registerVariables } from "../../lib/robot";
import "../Resources/serial_users";

export const parallel_test_data_variables = {
  FORCE_SINGLE_USER: false,
};
registerVariables(parallel_test_data_variables);
