import baseConfig, { constructGQLConfig } from "eslint-config-custom/react.mjs";

const appPath = "../../packages/common";
const config = [...baseConfig, constructGQLConfig(appPath, true)];

export default config;
