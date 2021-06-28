import { oidcClientId, oidcScope, publicUrl } from "../const";

const path = publicUrl || "";
const base = `${document.location.protocol}//${document.location.host}${path}`;

const configuration = {
  client_id: oidcClientId,
  redirect_uri: `${base}/login/helsinki/return`,
  response_type: "id_token token",
  post_logout_redirect_uri: base,
  scope: oidcScope,
  authority: "https://api.hel.fi/sso/",
  silent_redirect_uri: `${base}/login/helsinki/silent`,
  automaticSilentRenew: true,
  loadUserInfo: true,
};

export default configuration;
