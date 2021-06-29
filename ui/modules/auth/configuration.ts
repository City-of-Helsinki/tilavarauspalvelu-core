import { isBrowser, oidcClientId, oidcScope } from "../const";

let base = "";
if (isBrowser) {
  base = `${document.location.protocol}//${document.location.host}`;
}

const configuration = {
  client_id: oidcClientId,
  redirect_uri: `${base}/login/helsinki/return`,
  response_type: "id_token token",
  post_logout_redirect_uri: `${base}/?logout`,
  scope: oidcScope,
  authority: "https://api.hel.fi/sso/",
  silent_redirect_uri: `${base}/login/helsinki/silent`,
  automaticSilentRenew: true,
  loadUserInfo: false,
};

export default configuration;
