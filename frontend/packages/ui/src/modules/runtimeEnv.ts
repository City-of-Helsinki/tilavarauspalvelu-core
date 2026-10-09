/// Server only. Returns an inline script that sets window.__RUNTIME_CONFIG__
/// from the container environment, so the same image runs in all environments.
/// Static pages (404, 500) are rendered at build time, so they get the build environment.
/// Only pass keys that are safe to send to the browser.
export function getRuntimeConfigScript(keys: ReadonlyArray<string>): string {
  const runtimeConfig = Object.fromEntries(
    keys.flatMap((key) => {
      const value = process.env[key];
      return value === undefined ? [] : [[key, value]];
    })
  );
  // Escape "<" so a value can not close the script tag.
  const serializedConfig = JSON.stringify(runtimeConfig).replaceAll("<", String.raw`\u003c`);
  return `window.__RUNTIME_CONFIG__=${serializedConfig};`;
}
