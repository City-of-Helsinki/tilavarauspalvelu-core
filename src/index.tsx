import React from "react";
import ReactDOM from "react-dom";
import {
  oidcLog,
  InMemoryWebStorage,
  AuthenticationProvider,
  // eslint-disable-next-line import/no-unresolved
} from "@axa-fr/react-oidc-context";
import oidcConfiguration from "./common/auth/configuration";
import "./index.scss";
import App from "./App";
import reportWebVitals from "./reportWebVitals";
import UpdateToken from "./common/auth/UpdateToken";
import Authenticating from "./component/Authentication/Authenticating";
import NotAuthenticated from "./component/Authentication/NotAuthenticated";

ReactDOM.render(
  <React.StrictMode>
    <AuthenticationProvider
      notAuthenticated={NotAuthenticated}
      notAuthorized={() => <div>not autho</div>}
      authenticating={Authenticating}
      configuration={oidcConfiguration}
      loggerLevel={oidcLog.DEBUG}
      isEnabled
      callbackComponentOverride={UpdateToken}
      UserStore={InMemoryWebStorage}
    >
      <App />
    </AuthenticationProvider>
  </React.StrictMode>,
  document.getElementById("root")
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
