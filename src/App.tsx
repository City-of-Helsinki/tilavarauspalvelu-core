import React, { useState } from "react";
import { BrowserRouter, Redirect, Route, Switch } from "react-router-dom";
import Applications from "./component/Applications/Applications";
import ApplicationRound from "./component/Applications/Individual/ApplicationRound";
import PageWrapper from "./component/PageWrapper";
import "./i18n";
import { UIContext, UIContextType } from "./context/UIContext";
import Modal from "./component/Modal";
import Application from "./component/Applications/Application";
import ApplicationDetails from "./component/Applications/ApplicationDetails";

function App(): JSX.Element {
  const [modalContent, setModalContent] = useState<UIContextType | null>(null);

  const toggleModal = (content: UIContextType): void => {
    const bodyEl = document.getElementsByTagName("body")[0];
    const className = "noScroll";
    if (content) {
      bodyEl.classList.add(className);
    } else {
      bodyEl.classList.remove(className);
    }
    setModalContent(content);
  };

  return (
    <BrowserRouter>
      <UIContext.Provider
        value={{ modalContent: null, setModalContent: toggleModal }}
      >
        <PageWrapper>
          <Switch>
            <Route exact path="/">
              <Redirect to="/applications" />
            </Route>
            <Route exact path="/applications">
              <Applications />
            </Route>
            <Route exact path="/application/:applicationId">
              <Application />
            </Route>
            <Route exact path="/application/:applicationId/details">
              <ApplicationDetails />
            </Route>
            <Route path="/applicationRounds/:applicationRoundId">
              <ApplicationRound />
            </Route>
          </Switch>
        </PageWrapper>
        {modalContent && <Modal>{modalContent}</Modal>}
      </UIContext.Provider>
    </BrowserRouter>
  );
}

export default App;
