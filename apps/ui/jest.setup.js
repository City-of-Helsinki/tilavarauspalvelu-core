import "@testing-library/jest-dom";

import { setConfig } from "next/config";
import { server } from "./mocks/server";
import config from "./next.config";

setConfig(config);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
