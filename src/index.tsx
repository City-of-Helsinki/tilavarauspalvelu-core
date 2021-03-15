import React from "react";
import ReactDOM from "react-dom";
import {
  oidcLog,
  AuthenticationProvider,
  // eslint-disable-next-line import/no-unresolved
} from "@axa-fr/react-oidc-context";
import oidcConfiguration from "./common/auth/configuration";
import "./index.scss";
import App from "./App";
import reportWebVitals from "./reportWebVitals";
import Authenticating from "./component/Authentication/Authenticating";
import Login from "./component/Authentication/Login";
import AuthorizationNeeded from "./component/Authentication/AuthorizationNeeded";
import { authEnabled } from "./common/const";

ReactDOM.render(
  <React.StrictMode>
    <AuthenticationProvider
      notAuthenticated={() => <Login />}
      notAuthorized={() => <AuthorizationNeeded />}
      authenticating={() => <Authenticating noNavigation />}
      configuration={oidcConfiguration}
      loggerLevel={oidcLog.ERROR}
      isEnabled={authEnabled}
      callbackComponentOverride={() => <Authenticating />}
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
