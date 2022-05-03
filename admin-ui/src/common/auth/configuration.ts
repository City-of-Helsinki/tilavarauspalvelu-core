import { UserManagerSettings } from "oidc-client";
import { oidcClientId, oidcScope, publicUrl } from "../const";

const path = publicUrl || "";
const base = `${document.location.protocol}//${document.location.host}${path}`;

const isBrowser = typeof window !== "undefined";

const configuration: UserManagerSettings = {
  client_id: oidcClientId,
  redirect_uri: `${base}/login/helsinki/return`,
  response_type: "id_token token",
  post_logout_redirect_uri: base,
  scope: oidcScope,
  authority: "https://api.hel.fi/sso/",
  silent_redirect_uri: `${base}/login/helsinki/silent`,
  automaticSilentRenew: true,
  loadUserInfo: true,
  /** for temp debugging, please remove me! */
  accessTokenExpiringNotificationTime:
    isBrowser && window.location.search?.indexOf("expirefast")
      ? 3560
      : undefined,
};

export default configuration;
