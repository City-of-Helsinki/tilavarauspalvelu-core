import React, { useReducer, useState } from 'react';
import { useAsync } from 'react-use';
import {
  Route,
  Switch,
  useHistory,
  useParams,
  useRouteMatch,
} from 'react-router-dom';
import { Notification } from 'hds-react';
import { useTranslation } from 'react-i18next';
import {
  saveApplication,
  getApplication,
  getApplicationRound,
} from '../common/api';
import {
  Application as ApplicationType,
  ApplicationRound,
} from '../common/types';
import ApplicationPage from './ApplicationPage';
import Page1 from './page1/Page1';
import Page2 from './page2/Page2';
import Page3 from './page3/Page3';
import Preview from './preview/Preview';
import applicationReducer from './applicationReducer';
import applicationInitializer from './applicationInitializer';
import useReservationUnitList from '../common/hook/useReservationUnitList';

type ParamTypes = {
  applicationRoundId: string;
  applicationId: string;
};

const Application = (): JSX.Element | null => {
  const { t } = useTranslation();

  const history = useHistory();
  const match = useRouteMatch();

  const [error, setError] = useState<string | null>();

  const { applicationId, applicationRoundId } = useParams<ParamTypes>();

  const [application, dispatch] = useReducer(
    applicationReducer,
    {
      id: Number.isNaN(applicationId) ? Number(applicationId) : undefined,
      applicationRoundId: Number(applicationRoundId),
    } as ApplicationType,
    applicationInitializer
  );

  const applicationRoundLoadingStatus = useAsync(async () => {
    const loadedApplicationRound = await getApplicationRound({
      id: applicationRoundId,
    });
    return loadedApplicationRound;
  }, [applicationRoundId]);

  const applicationLoadingStatus = useAsync(async () => {
    let loadedApplication = null;
    if (applicationId && applicationId !== 'new') {
      loadedApplication = await getApplication(Number(applicationId));
      dispatch({ type: 'load', data: loadedApplication });
    }
    return loadedApplication;
  }, [applicationId]);

  const { reservationUnits, clearSelections } = useReservationUnitList();

  const saveWithEffect = async (
    appToSave: ApplicationType,
    postSave?: (string?: number) => void
  ) => {
    let loadedApplication: ApplicationType;

    try {
      if (applicationId === 'new') {
        // because applicationEvent needs applicationId we need to save application first
        const tmpApplication = { ...appToSave };
        tmpApplication.applicationEvents = [];
        const savedApplication = await saveApplication(tmpApplication);

        if (!savedApplication.id) {
          throw new Error('cannot proceed, saved application does not have id');
        }

        savedApplication.applicationEvents = [
          ...appToSave.applicationEvents.map((ae) => ({
            ...ae,
            applicationId: savedApplication.id || 0,
          })),
        ];

        loadedApplication = await saveApplication(savedApplication);
      } else {
        loadedApplication = await saveApplication(appToSave);
      }

      dispatch({ type: 'load', data: loadedApplication });

      if (postSave) {
        postSave(loadedApplication.id);
      }
    } catch (e) {
      setError(`${t('Application.error.saveFailed')}:${e.message}`);
    }
  };

  const saveAndNavigate = (path: string) => async (
    appToSave: ApplicationType
  ) =>
    saveWithEffect(appToSave, (id) => {
      const prefix = id ? match.url.replace('new', String(id)) : match.url;
      const target = `${prefix}/${path}`;
      clearSelections();
      history.push(target);
    });

  const addNewApplicationEvent = async () => {
    dispatch({
      type: 'addNewApplicationEvent',
      data: application,
    });
  };

  const applicationRoundName = applicationRoundLoadingStatus.value?.name || '';

  const ready =
    ![applicationRoundLoadingStatus, applicationLoadingStatus].some(
      (r) => r.loading
    ) && application;

  if (!ready) {
    return null;
  }

  return (
    <>
      <Switch>
        <Route exact path={`${match.url}/page1`}>
          <ApplicationPage
            breadCrumbText={applicationRoundName}
            overrideText={applicationRoundName}
            translationKeyPrefix="Application.Page1"
            match={match}>
            <Page1
              selectedReservationUnits={reservationUnits}
              applicationRound={
                applicationRoundLoadingStatus.value || ({} as ApplicationRound)
              }
              application={application}
              onNext={saveAndNavigate('page2')}
              addNewApplicationEvent={addNewApplicationEvent}
            />
          </ApplicationPage>
        </Route>
        <Route exact path={`${match.url}/page2`}>
          <ApplicationPage
            translationKeyPrefix="Application.Page2"
            match={match}
            breadCrumbText={applicationRoundName}>
            <Page2
              application={application}
              onNext={saveAndNavigate('page3')}
            />
          </ApplicationPage>
        </Route>
        <Route exact path={`${match.url}/page3`}>
          <ApplicationPage
            translationKeyPrefix="Application.Page3"
            match={match}
            breadCrumbText={applicationRoundName}>
            <Page3
              application={application}
              onNext={saveAndNavigate('preview')}
            />
          </ApplicationPage>
        </Route>
        <Route exact path={`${match.url}/preview`}>
          <ApplicationPage
            translationKeyPrefix="Application.preview"
            match={match}
            breadCrumbText={applicationRoundName}>
            <Preview
              application={application}
              onNext={() => saveAndNavigate('preview')}
            />
          </ApplicationPage>
        </Route>
      </Switch>
      {error ? (
        <Notification
          type="error"
          label="Unexpected error"
          position="top-center"
          autoClose
          displayAutoCloseProgress={false}
          onClose={() => setError(null)}>
          {error}
        </Notification>
      ) : null}
    </>
  );
};

export default Application;
