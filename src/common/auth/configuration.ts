const base = `${document.location.protocol}//${document.location.host}`;

const configuration = {
  client_id: process.env.REACT_APP_OIDC_CLIENT_ID,
  redirect_uri: `${base}/login/helsinki/return`,
  response_type: "id_token token",
  post_logout_redirect_uri: base,
  scope: "openid profile email",
  authority: "https://api.hel.fi/sso/",
  silent_redirect_uri: `${base}/login/helsinki/return`,
  automaticSilentRenew: true,
  loadUserInfo: false,
};

export default configuration;
