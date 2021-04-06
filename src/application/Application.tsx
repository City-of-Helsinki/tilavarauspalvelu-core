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
  EditorState,
} from '../common/types';
import ApplicationPage from './ApplicationPage';
import Page1 from './page1/Page1';
import Page2 from './page2/Page2';
import Page3 from './page3/Page3';
import Preview from './preview/Preview';
import applicationReducer from './applicationReducer';
import useReservationUnitList from '../common/hook/useReservationUnitList';
import Sent from './sent/Sent';
import { CenterSpinner } from '../component/common';

type ParamTypes = {
  applicationId: string;
};

const Application = (): JSX.Element | null => {
  const { t } = useTranslation();

  const history = useHistory();
  const match = useRouteMatch();

  const [error, setError] = useState<string | null>();

  const { applicationId } = useParams<ParamTypes>();

  const [state, dispatch] = useReducer(applicationReducer, {
    application: { id: 0 } as ApplicationType,
    accordionStates: [],
    loading: true,
  } as EditorState);

  const applicationRoundLoadingStatus = useAsync(async () => {
    if (state.application.applicationRoundId) {
      const loadedApplicationRound = await getApplicationRound({
        id: state.application.applicationRoundId,
      });
      return loadedApplicationRound;
    }
    return null;
  }, [state.application.id]);

  const applicationLoadingStatus = useAsync(async () => {
    let loadedApplication = null;
    if (applicationId && Number(applicationId)) {
      loadedApplication = await getApplication(Number(applicationId));
      dispatch({ type: 'load', application: loadedApplication });
    }
    return loadedApplication;
  });

  const { reservationUnits, clearSelections } = useReservationUnitList();

  const saveWithEffect = async (
    appToSave: ApplicationType,
    postSave?: (string?: number) => void,
    eventId?: number
  ) => {
    let loadedApplication: ApplicationType;

    try {
      const existingIds = appToSave.applicationEvents
        .filter((ae) => ae.id)
        .map((ae) => ae.id);
      loadedApplication = await saveApplication(appToSave);
      const newEvent = loadedApplication.applicationEvents.filter(
        (ae) => existingIds.indexOf(ae.id) === -1
      );
      dispatch({
        type: 'save',
        application: loadedApplication,
        savedEventId: eventId || (newEvent.length && newEvent[0].id) || 0,
      });

      if (postSave) {
        postSave(loadedApplication.id);
      }
    } catch (e) {
      setError(`${t('Application.error.saveFailed')}`);
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
    });
  };

  const applicationRoundName = applicationRoundLoadingStatus.value?.name || '';

  const ready =
    ![applicationRoundLoadingStatus, applicationLoadingStatus].some(
      (r) => r.loading
    ) && state.loading === false;

  if (!ready) {
    return <CenterSpinner />;
  }

  return (
    <>
      <Switch>
        <Route exact path={`${match.url}/page1`}>
          <ApplicationPage
            application={state.application}
            breadCrumbText={applicationRoundName}
            overrideText={applicationRoundName}
            translationKeyPrefix="Application.Page1"
            match={match}>
            <Page1
              selectedReservationUnits={reservationUnits}
              applicationRound={
                applicationRoundLoadingStatus.value || ({} as ApplicationRound)
              }
              dispatch={dispatch}
              editorState={state}
              save={({
                application,
                eventId,
              }: {
                application: ApplicationType;
                eventId?: number;
              }) => saveWithEffect(application, undefined, eventId)}
              addNewApplicationEvent={addNewApplicationEvent}
              setError={setError}
            />
          </ApplicationPage>
        </Route>
        <Route exact path={`${match.url}/page2`}>
          <ApplicationPage
            application={state.application}
            translationKeyPrefix="Application.Page2"
            match={match}
            breadCrumbText={applicationRoundName}>
            <Page2
              application={state.application}
              onNext={saveAndNavigate('page3')}
            />
          </ApplicationPage>
        </Route>
        <Route exact path={`${match.url}/page3`}>
          <ApplicationPage
            application={state.application}
            translationKeyPrefix="Application.Page3"
            match={match}
            breadCrumbText={applicationRoundName}>
            <Page3
              application={state.application}
              onNext={saveAndNavigate('preview')}
            />
          </ApplicationPage>
        </Route>
        <Route exact path={`${match.url}/preview`}>
          <ApplicationPage
            application={state.application}
            translationKeyPrefix="Application.preview"
            match={match}
            breadCrumbText={applicationRoundName}>
            <Preview
              application={state.application}
              onNext={saveAndNavigate('sent')}
            />
          </ApplicationPage>
        </Route>
        <Route exact path={`${match.url}/sent`}>
          <Sent breadCrumbText={applicationRoundName} />
        </Route>
      </Switch>
      {error ? (
        <Notification
          type="error"
          label={error}
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
