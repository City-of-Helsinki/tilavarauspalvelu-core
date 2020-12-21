import React, { useEffect, useState, useReducer } from 'react';
import {
  Route,
  Switch,
  useHistory,
  useParams,
  useRouteMatch,
} from 'react-router-dom';
import {
  saveApplication,
  getApplication,
  getApplicationPeriod,
} from '../common/api';
import {
  Application as ApplicationType,
  ApplicationPeriod,
} from '../common/types';
import ApplicationPage from './ApplicationPage';
import Page1 from './page1/Page1';
import Page2 from './page2/Page2';
import Page3 from './page3/Page3';
import Preview from './preview/Preview';
import applicationReducer from './applicationReducer';
import applicationInitializer from './applicationInitializer';

import {
  SelectionsListContext,
  SelectionsListContextType,
} from '../context/SelectionsListContext';

type ParamTypes = {
  applicationPeriodId: string;
  applicationId: string;
};

const Application = (): JSX.Element | null => {
  const history = useHistory();
  const match = useRouteMatch();
  const { applicationId, applicationPeriodId } = useParams<ParamTypes>();

  const [ready, setReady] = useState(false);
  const [applicationPeriod, setApplicationPeriod] = useState<ApplicationPeriod>(
    {} as ApplicationPeriod
  );
  const [application, dispatch] = useReducer(
    applicationReducer,
    {
      id: Number.isNaN(applicationId) ? Number(applicationId) : undefined,
      applicationPeriodId: Number(applicationPeriodId),
    } as ApplicationType,
    applicationInitializer
  );

  useEffect(() => {
    async function fetchData() {
      const unit = await getApplicationPeriod({ id: applicationPeriodId });
      setApplicationPeriod(unit);
      if (applicationId !== 'new') {
        const loadedApplication = await getApplication(Number(applicationId));
        dispatch({ type: 'load', data: loadedApplication });
      }
      setReady(true);
    }
    fetchData();
  }, [applicationPeriodId, applicationId]);

  const { reservationUnits } = React.useContext(
    SelectionsListContext
  ) as SelectionsListContextType;

  const saveWithEffect = async (postSave: (string?: number) => void) => {
    let loadedApplication: ApplicationType;

    if (applicationId === 'new') {
      // because applicationEvent needs applicationId we need to save application first
      const tmpApplication = { ...application };
      const applicationEvent = tmpApplication.applicationEvents.pop();
      const savedApplication = await saveApplication(tmpApplication);

      if (!savedApplication.id) {
        throw new Error('cannot proceed, saved application does not have id');
      }
      if (applicationEvent) {
        applicationEvent.applicationId = savedApplication.id;
        savedApplication.applicationEvents.push(applicationEvent);
      }
      loadedApplication = await saveApplication(savedApplication);

      if (savedApplication.id) {
        const replaceUrl = match.url.replace(
          'new',
          String(savedApplication.id)
        );

        history.replace(`${replaceUrl}/page1`);
      }
    } else {
      loadedApplication = await saveApplication(application);
    }

    dispatch({ type: 'load', data: loadedApplication });

    postSave(loadedApplication.id);
  };

  const saveAndNavigate = async (path: string) => {
    saveWithEffect((id) => {
      const prefix = id ? match.url.replace('new', String(id)) : match.url;
      const target = `${prefix}/${path}`;
      history.push(target);
    });
  };

  return ready ? (
    <Switch>
      <Route exact path={`${match.url}/page1`}>
        <ApplicationPage
          breadCrumbText={applicationPeriod.name}
          overrideText={applicationPeriod.name}
          translationKeyPrefix="Application.Page1"
          match={match}>
          <Page1
            reservationUnits={reservationUnits}
            applicationPeriod={applicationPeriod}
            application={application}
            onNext={() => saveAndNavigate('page2')}
          />
        </ApplicationPage>
      </Route>
      <Route exact path={`${match.url}/page2`}>
        <ApplicationPage
          translationKeyPrefix="Application.Page2"
          match={match}
          breadCrumbText={applicationPeriod.name}>
          <Page2
            application={application}
            onNext={() => saveAndNavigate('page3')}
          />
        </ApplicationPage>
      </Route>
      <Route exact path={`${match.url}/page3`}>
        <ApplicationPage
          translationKeyPrefix="Application.Page3"
          match={match}
          breadCrumbText={applicationPeriod.name}>
          <Page3
            dispatch={dispatch}
            application={application}
            onNext={() => saveAndNavigate('preview')}
          />
        </ApplicationPage>
      </Route>
      <Route exact path={`${match.url}/preview`}>
        <ApplicationPage
          translationKeyPrefix="Application.preview"
          match={match}
          breadCrumbText={applicationPeriod.name}>
          <Preview
            application={application}
            onNext={() => saveAndNavigate('preview')}
          />
        </ApplicationPage>
      </Route>
    </Switch>
  ) : null;
};

export default Application;
