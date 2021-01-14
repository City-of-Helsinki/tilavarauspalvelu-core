import React from 'react';
import { Route, Switch } from 'react-router-dom';
import PageWrapper from './component/PageWrapper';
import './i18n';
import SelectionsListContextProvider from './context/SelectionsListContext';
import StartApplicationBar from './component/StartApplicationBar';
import './index.scss';
import './variables.css';
import Routes from './common/routes';

function App(): JSX.Element {
  return (
    <SelectionsListContextProvider>
      <PageWrapper>
        <Switch>
          {Routes.map((route) => (
            <Route
              key={route.path}
              exact={route.exact}
              path={route.path}
              render={() => {
                const Component = route.component;
                return <Component />;
              }}
            />
          ))}
        </Switch>
      </PageWrapper>
      <StartApplicationBar />
    </SelectionsListContextProvider>
  );
}

export default App;
