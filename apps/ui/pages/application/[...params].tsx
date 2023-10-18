import React, { useEffect, useState } from "react";
import { useAsync } from "react-use";
import { Notification } from "hds-react";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";
import { GetServerSideProps } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import i18next from "i18next";
import { ApplicationEvent, Application as ApplicationType } from "common/types/common";
import {
  Query,
  QueryApplicationRoundsArgs,
  QueryTermsOfUseArgs,
  ReservationUnitType,
  TermsOfUseType,
} from "common/types/gql-types";
import { redirectProtectedRoute } from "@/modules/protectedRoute";
import { saveApplication, getApplication } from "../../modules/api";
import { ApplicationPageWrapper } from "@/components/application/ApplicationPage";
import { defaultDuration } from "@/modules/const";
import Page1 from "../../components/application/Page1";
import Page2 from "../../components/application/Page2";
import Page3 from "../../components/application/Page3";
import Preview from "../../components/application/Preview";
import View from "../../components/application/View";
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
import { createApolloClient } from "../../modules/apolloClient";
import { APPLICATION_ROUNDS } from "../../modules/queries/applicationRound";

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const { locale } = ctx;

  const redirect = redirectProtectedRoute(ctx);
  if (redirect) {
    return redirect;
  }

  const apolloClient = createApolloClient(ctx);
  const { data: tosData } = await apolloClient.query<
    Query,
    QueryTermsOfUseArgs
  >({
    query: TERMS_OF_USE,
  });

  // TODO why does this work? pk should be number but we compare to string?
  // is this an inconsistency in the backend?
  const tos = tosData?.termsOfUse?.edges
    .map((n) => n?.node)
    .filter((n) => n?.pk === "KUVAnupa" || n?.pk === "generic1");

  return {
    props: {
      key: locale,
      tos,
      ...(await serverSideTranslations(locale ?? "fi")),
    },
  };
};

const createApplicationEvent = (
  applicationId?: number,
  begin?: string,
  end?: string
): ApplicationEvent => ({
  // TODO this is bad, use the hook instead (or empty / undefined and default value in the Page1)
  // it's bad because the translation might not be loaded yet when this is shown
  // useTranslation from next-i18next handles translation loading automatically
  name: i18next.t("Application.Page1.applicationEventName"),
  minDuration: defaultDuration,
  maxDuration: defaultDuration,
  eventsPerWeek: 1,
  numPersons: null,
  ageGroupId: null,
  purposeId: null,
  abilityGroupId: null,
  applicationId: applicationId || 0,
  begin: begin || null,
  end: end || null,
  biweekly: false,
  eventReservationUnits: [],
  applicationEventSchedules: [],
  status: "created",
});

type Props = {
  tos: TermsOfUseType[];
};

const ApplicationRootPage = ({ tos }: Props): JSX.Element | null => {
  const { t } = useTranslation();
  const router = useRouter();
  const [error, setError] = useState<string | null>();
  const [localApplication, setLocalApplication] = useState<ApplicationType | null>(
    null
  );

  const [applicationId, pageId] = router.query?.params as string[];

  const handleLoad = (application: ApplicationType) => {
    if (application != null) {
      setLocalApplication(application);
      /*  this is silly, we should have a better way to deal with new applications
      if (application.applicationEvents?.length < 1) {
        nextState.application.applicationEvents.push(
          applicationEvent(
            action.application?.id,
            action?.params?.begin,
            action?.params?.end
          )
        );
      */
    }
  }

  const applicationLoadingStatus = useAsync(async () => {
    // TODO check for NaN also
    if (applicationId && Number(applicationId)) {
      try {
        // FIXME replace with GQL
        const application = await getApplication(Number(applicationId));
        // TODO this is weird, why are we not using Client side cache?
        const apolloClient = createApolloClient(undefined);
        const { data } = await apolloClient.query<
          Query,
          QueryApplicationRoundsArgs
        >({
          query: APPLICATION_ROUNDS,
          fetchPolicy: "no-cache",
        });
        const applicationRound = data.applicationRounds?.edges
          ?.map((n) => n?.node)
          .find((n) => n?.pk === application.applicationRoundId);

        // convert dates
        application.applicationEvents.forEach((ae, i) => {
          if (ae.end) {
            application.applicationEvents[i].end = apiDateToUIDate(ae.end);
          }
          if (ae.begin) {
            application.applicationEvents[i].begin = apiDateToUIDate(ae.begin);
          }
        });
        handleLoad(application);
        return { application, applicationRound };
      } catch (e) {
        setError(`${t("common:error.dataError")}`);
      }
    }
    return null;
  });

  const { reservationUnits, clearSelections } = useReservationUnitList();

  const handleSave = async (appToSave: ApplicationType) => {
    const transformForSaving = (app: ApplicationType): ApplicationType => {
      const tapp = deepCopy(app);
      tapp.applicationEvents.forEach((ae, i) => {
        const begin = ae.begin != null ? uiDateToApiDate(ae.begin) : null;
        const end = ae.end != null ? uiDateToApiDate(ae.end) : null;
        tapp.applicationEvents[i].begin = begin ?? null;
        tapp.applicationEvents[i].end = end ?? null;
      });
      return tapp;
    };

    try {
      const savedApplication = await saveApplication(transformForSaving(appToSave));
      // TODO do a refetch here instead of cache modification (after moving to fetch hook)
      return savedApplication.id;
    } catch (e) {
      setError(`${t("application:error.saveFailed")}`);
      throw e;
    }
  };

  const saveAndNavigate = (path: string) => async (appToSave: ApplicationType) => {
    const id = await handleSave(appToSave);
    const prefix = `/application/${id}`;
    const target = `${prefix}/${path}`;
    clearSelections();
    router.push(target);
  };

  const applicationRound = applicationLoadingStatus.value?.applicationRound;

  const [localApplicationEvents, setLocalApplicationEvents] = useState<
    ApplicationEvent[]> ([]);

  useEffect(() => {
    if (localApplication?.id) {
      setLocalApplicationEvents(localApplication.applicationEvents);
    }
  }, [localApplication]);

  const handleRemoveUnsavedApplicationEvent = () => {
    // TODO can we be sure that the last element is the new one? for now at least we can
    setLocalApplicationEvents((prev) => prev.slice(0, -1));
  }

  const handleNewApplicationEvent = () => {
    const begin = applicationRound?.reservationPeriodBegin;
    const end = applicationRound?.reservationPeriodEnd;
    const params = applicationLoadingStatus.value
      ? {
          begin: begin ? apiDateToUIDate(begin) : "",
          end: end ? apiDateToUIDate(end) : "",
        }
      : {};
    setLocalApplicationEvents((prev) => [
      ...prev,
      createApplicationEvent(application?.id, params?.begin, params?.end)
    ]);
    // TODO do we need to keep this also?
    // nextState.applicationEvents = nextState.application.applicationEvents.map((ae) => ae.id as number)
  };

  const appRound =
    applicationLoadingStatus.value?.applicationRound ?? undefined;
  const applicationRoundName =
    appRound != null ? getTranslation(appRound, "name") : "-";

  // TODO use hook and loading state from it
  const ready = true // !applicationLoadingStatus.loading && state.loading === false;

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

  const rerender = localApplicationEvents.length; // rerender every time event count is changed so that form state stays in sync

  // Modify the laoded application to include localchanges
  const application = localApplication ? {
    ...localApplication,
    applicationEvents: localApplicationEvents,
  } : undefined;

  // For now FIXME (we need special handling for the first element)
  // or we need checks down the line to handle 0 length arrays
  if (!application || application.applicationEvents.length === 0 ) {
    return null;
  }

  return (
    <>
      {pageId === "page1" && (
        <ApplicationPageWrapper
          key={rerender}
          application={application}
          overrideText={applicationRoundName}
          translationKeyPrefix="application:Page1"
        >
          {applicationRound != null && (
            <Page1
              selectedReservationUnits={
                reservationUnits as ReservationUnitType[]
              }
              applicationRound={applicationRound}
              onDeleteUnsavedEvent={handleRemoveUnsavedApplicationEvent}
              application={application}
              // TODO what is the purpose of this?
              savedEventId={0} // state.savedEventId}
              save={({ application }: { application: ApplicationType }) => handleSave(application)}
              addNewApplicationEvent={handleNewApplicationEvent}
              setError={setError}
            />
          )}
        </ApplicationPageWrapper>
      )}
      {pageId === "page2" && (
        <ApplicationPageWrapper
          application={application}
          translationKeyPrefix="application:Page2"
        >
          <Page2
            application={application}
            onNext={saveAndNavigate("page3")}
          />
        </ApplicationPageWrapper>
      )}
      {pageId === "page3" && (
        <ApplicationPageWrapper
          application={application}
          translationKeyPrefix="application:Page3"
        >
          <Page3
            application={application}
            onNext={saveAndNavigate("preview")}
          />
        </ApplicationPageWrapper>
      )}
      {pageId === "preview" && (
       <ApplicationPageWrapper
          application={application}
          translationKeyPrefix="application:preview"
        >
          <Preview
            application={application}
            onNext={saveAndNavigate("sent")}
            tos={tos}
          />
        </ApplicationPageWrapper>
      )}
      {pageId === "view" && (
        <ApplicationPageWrapper
          application={application}
          translationKeyPrefix="application:view"
          headContent={applicationRoundName}
          hideStepper
        >
          <View application={application} tos={tos} />
        </ApplicationPageWrapper>
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
