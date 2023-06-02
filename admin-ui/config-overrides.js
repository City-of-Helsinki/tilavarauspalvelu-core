var path = require("path");

const { override, babelInclude, addWebpackAlias } = require("customize-cra");

module.exports = function (config, env) {
  let loaders = config.resolve;

  loaders.fallback = {
    fs: false,
    path: require.resolve("path-browserify"),
  };

  return Object.assign(
    config,
    override(
      babelInclude([
        /* transpile (converting to es5) code in src/ and shared component library */
        path.resolve("src"),
        path.resolve("../common"),
      ]),
      addWebpackAlias({
        ["app"]: path.resolve(__dirname, "src"),
      })
    )(config, env)
  );
};
