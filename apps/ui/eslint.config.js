import baseConfig, { constructGQLConfig } from "eslint-config-custom/react.mjs";

const appPath = "../../apps/ui";

const config = [...baseConfig, constructGQLConfig(appPath)];

export default config;
