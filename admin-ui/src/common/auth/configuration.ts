import { UserManagerSettings } from "oidc-client";
import { oidcClientId, oidcScope, publicUrl, oidcUrl } from "../const";

const path = publicUrl || "";
const base = `${document.location.protocol}//${document.location.host}${path}`;

const configuration: UserManagerSettings = {
  client_id: oidcClientId,
  redirect_uri: `${base}/login/helsinki/return`,
  response_type: "id_token token",
  post_logout_redirect_uri: base,
  scope: oidcScope,
  authority: `${oidcUrl}/`,
  silent_redirect_uri: `${base}/login/helsinki/silent`,
  automaticSilentRenew: true,
  loadUserInfo: true,
};

export default configuration;
