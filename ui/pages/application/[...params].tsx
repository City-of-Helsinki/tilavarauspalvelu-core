import React, { useReducer, useState } from "react";
import { useAsync } from "react-use";
import { Notification } from "hds-react";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";
import { GetServerSideProps } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import {
  Application as ApplicationType,
  EditorState,
} from "common/types/common";
import {
  ApplicationRoundType,
  Query,
  QueryApplicationRoundsArgs,
  QueryTermsOfUseArgs,
  ReservationUnitType,
  TermsOfUseType,
  TermsOfUseTypeEdge,
} from "common/types/gql-types";
import { saveApplication, getApplication } from "../../modules/api";
import ApplicationPage from "../../components/application/ApplicationPage";
import Page1 from "../../components/application/Page1";
import Page2 from "../../components/application/Page2";
import Page3 from "../../components/application/Page3";
import Preview from "../../components/application/Preview";
import View from "../../components/application/View";
import applicationReducer from "../../modules/application/applicationReducer";
import useReservationUnitList from "../../hooks/useReservationUnitList";
import Sent from "../../components/application/Sent";
import { CenterSpinner } from "../../components/common/common";
import {
  apiDateToUIDate,
  deepCopy,
  getTranslation,
  uiDateToApiDate,
} from "../../modules/util";
import { TERMS_OF_USE } from "../../modules/queries/reservationUnit";
import apolloClient from "../../modules/apolloClient";
import { APPLICATION_ROUNDS } from "../../modules/queries/applicationRound";

export const getServerSideProps: GetServerSideProps = async ({ locale }) => {
  const { data: tosData } = await apolloClient.query<
    Query,
    QueryTermsOfUseArgs
  >({
    query: TERMS_OF_USE,
  });

  const tos = tosData?.termsOfUse?.edges
    .map((n: TermsOfUseTypeEdge) => n.node)
    .filter((n) => ["KUVAnupa", "generic1"].includes(n.pk));

  return {
    props: {
      tos,
      ...(await serverSideTranslations(locale)),
    },
  };
};

type Props = {
  tos: TermsOfUseType[];
};

const ApplicationRootPage = ({ tos }: Props): JSX.Element | null => {
  const { t } = useTranslation();

  const [error, setError] = useState<string | null>();

  const [state, dispatch] = useReducer(applicationReducer, {
    application: { id: 0 } as ApplicationType,
    accordionStates: [],
    loading: true,
  } as EditorState);

  const router = useRouter();
  const {
    query: { params },
  } = router;

  const [applicationId, pageId] = params as string[];

  const applicationLoadingStatus = useAsync(async () => {
    if (applicationId && Number(applicationId)) {
      try {
        const application = await getApplication(Number(applicationId));
        const { data } = await apolloClient.query<
          Query,
          QueryApplicationRoundsArgs
        >({
          query: APPLICATION_ROUNDS,
          fetchPolicy: "no-cache",
        });
        const applicationRound = data.applicationRounds?.edges
          ?.map((n) => n.node)
          .find((n) => n.pk === application.applicationRoundId);

        // convert dates
        application.applicationEvents.forEach((ae, i) => {
          if (ae.end) {
            application.applicationEvents[i].end = apiDateToUIDate(ae.end);
          }
          if (ae.begin) {
            application.applicationEvents[i].begin = apiDateToUIDate(ae.begin);
          }
        });
        dispatch({
          type: "load",
          application,
          params: {
            begin: apiDateToUIDate(applicationRound.reservationPeriodBegin),
            end: apiDateToUIDate(applicationRound.reservationPeriodEnd),
          },
        });
        return { application, applicationRound };
      } catch (e) {
        setError(`${t("common:error.dataError")}`);
      }
    }
    return null;
  });

  const { reservationUnits, clearSelections } = useReservationUnitList();

  const transform = (app: ApplicationType): ApplicationType => {
    const appToSave = deepCopy(app);
    appToSave.applicationEvents.forEach((ae, i) => {
      appToSave.applicationEvents[i].begin = uiDateToApiDate(
        ae.begin as string
      );
      appToSave.applicationEvents[i].end = uiDateToApiDate(ae.end as string);
    });
    return appToSave;
  };

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
      loadedApplication = await saveApplication(transform(appToSave));
      const newEvent = loadedApplication.applicationEvents.filter(
        (ae) => existingIds.indexOf(ae.id) === -1
      );
      dispatch({
        type: "save",
        application: loadedApplication,
        savedEventId: eventId || (newEvent.length && newEvent[0].id) || 0,
      });

      if (postSave) {
        postSave(loadedApplication.id);
      }
    } catch (e) {
      setError(`${t("application:error.saveFailed")}`);
      throw e;
    }
  };

  const saveAndNavigate =
    (path: string) => async (appToSave: ApplicationType) =>
      saveWithEffect(appToSave, (id) => {
        const prefix = `/application/${id}`;
        const target = `${prefix}/${path}`;
        clearSelections();
        router.push(target);
      });

  const addNewApplicationEvent = async () => {
    const args = {} as {
      [key: string]: string;
    };
    if (applicationLoadingStatus.value) {
      args.begin = apiDateToUIDate(
        applicationLoadingStatus.value.applicationRound.reservationPeriodBegin
      );
      args.end = apiDateToUIDate(
        applicationLoadingStatus.value.applicationRound.reservationPeriodEnd
      );
    }

    dispatch({
      params: args,
      type: "addNewApplicationEvent",
    });
  };

  const applicationRoundName =
    getTranslation(applicationLoadingStatus.value?.applicationRound, "name") ||
    "";

  const ready = !applicationLoadingStatus.loading && state.loading === false;

  if (!ready) {
    return error ? (
      <Notification
        type="error"
        label={error}
        position="top-center"
        displayAutoCloseProgress={false}
        onClose={() => router.reload()}
      >
        {error}
      </Notification>
    ) : (
      <CenterSpinner />
    );
  }

  const rerender = state.application.applicationEvents.length; // rerender every time event count is changed so that form state stays in sync

  return (
    <>
      {pageId === "page1" && (
        <ApplicationPage
          key={rerender}
          application={state.application}
          overrideText={applicationRoundName}
          translationKeyPrefix="application:Page1"
        >
          <Page1
            selectedReservationUnits={reservationUnits as ReservationUnitType[]}
            applicationRound={
              applicationLoadingStatus.value?.applicationRound ||
              ({} as ApplicationRoundType)
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
      )}
      {pageId === "page2" && (
        <ApplicationPage
          application={state.application}
          translationKeyPrefix="application:Page2"
        >
          <Page2
            application={state.application}
            onNext={saveAndNavigate("page3")}
          />
        </ApplicationPage>
      )}
      {pageId === "page3" && (
        <ApplicationPage
          application={state.application}
          translationKeyPrefix="application:Page3"
        >
          <Page3
            application={state.application}
            onNext={saveAndNavigate("preview")}
          />
        </ApplicationPage>
      )}
      {pageId === "preview" && (
        <ApplicationPage
          application={state.application}
          translationKeyPrefix="application:preview"
        >
          <Preview
            application={state.application}
            onNext={saveAndNavigate("sent")}
            tos={tos}
          />
        </ApplicationPage>
      )}
      {pageId === "view" && (
        <ApplicationPage
          application={state.application}
          translationKeyPrefix="application:view"
          headContent={getTranslation(
            applicationLoadingStatus.value?.applicationRound,
            "name"
          )}
          hideStepper
        >
          <View application={state.application} tos={tos} />
        </ApplicationPage>
      )}
      {pageId === "sent" && <Sent />}

      {error ? (
        <Notification
          type="error"
          label={error}
          position="top-center"
          autoClose
          displayAutoCloseProgress={false}
          onClose={() => setError(null)}
        >
          {error}
        </Notification>
      ) : null}
    </>
  );
};

export default ApplicationRootPage;
