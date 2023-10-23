import React, { useEffect, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { Notification } from "hds-react";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";
import { GetServerSideProps } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import {
  Query,
  QueryApplicationsArgs,
  QueryTermsOfUseArgs,
  ReservationUnitType,
  TermsOfUseType,
  Mutation,
  MutationCreateApplicationArgs,
  MutationUpdateApplicationArgs,
  ApplicationCreateMutationInput,
  Priority,
} from "common/types/gql-types";
import { APPLICATION_QUERY } from "common/src/queries/application";
import { gql, useMutation, useQuery } from "@apollo/client";
import { ApplicationEventSchedulePriority } from "common";
import { filterNonNullable } from "common/src/helpers";
import { redirectProtectedRoute } from "@/modules/protectedRoute";
import { ApplicationPageWrapper } from "@/components/application/ApplicationPage";
import Page1 from "@/components/application/Page1";
import Page2 from "@/components/application/Page2";
import Page3 from "@/components/application/Page3";
import Preview from "@/components/application/Preview";
import View from "@/components/application/View";
import useReservationUnitList from "@/hooks/useReservationUnitList";
import Sent from "@/components/application/Sent";
import { CenterSpinner } from "@/components/common/common";
import { apiDateToUIDate, getTranslation } from "@/modules/util";
import { TERMS_OF_USE } from "@/modules/queries/reservationUnit";
import { createApolloClient } from "@/modules/apolloClient";
import {
  ApplicationFormValues,
  convertAddress,
  convertOrganisation,
  convertPerson,
  transformApplicationEventToForm,
} from "@/components/application/Form";

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

type Props = {
  tos: TermsOfUseType[];
};

const CREATE_APPLICATION_MUTATION = gql`
  mutation ($input: ApplicationCreateMutationInput!) {
    createApplication(input: $input) {
      errors {
        messages
      }
    }
  }
`;
// TODO do we need createApplicationEventMutation also?

const UPDATE_APPLICATION_MUTATION = gql`
  mutation ($input: ApplicationUpdateMutationInput!) {
    updateApplication(input: $input) {
      errors {
        messages
      }
    }
  }
`;

const ApplicationRootPage = ({ tos }: Props): JSX.Element | null => {
  const { t } = useTranslation();
  const router = useRouter();
  const [error, setError] = useState<string | null>();

  const [applicationId, pageId] = router.query?.params as string[];

  const { data: applicationData, loading: isLoading } = useQuery<
    Query,
    QueryApplicationsArgs
  >(APPLICATION_QUERY, {
    variables: {
      pk: [applicationId],
    },
    skip: !applicationId,
    onError: (e) => {
      console.warn("applications query failed: ", e);
      setError(`${t("common:error.dataError")}`);
    },
  });

  console.log("applicationData: ", applicationData);

  const localApplication =
    applicationData?.applications?.edges?.[0]?.node ?? undefined;
  const applicationRound = localApplication?.applicationRound ?? undefined;

  const { reservationUnits, clearSelections } = useReservationUnitList();

  const [create] = useMutation<Mutation, MutationCreateApplicationArgs>(
    CREATE_APPLICATION_MUTATION,
    {
      onError: (e) => {
        console.warn("create application mutation failed: ", e);
        setError(`${t("application:error.saveFailed")}`);
      },
    }
  );
  const [update] = useMutation<Mutation, MutationUpdateApplicationArgs>(
    UPDATE_APPLICATION_MUTATION,
    {
      onError: (e) => {
        console.warn("update application mutation failed: ", e);
        setError(`${t("application:error.saveFailed")}`);
      },
    }
  );

  const handleSave = async (appToSave: ApplicationFormValues) => {
    // TODO replace this with Application -> ApplicationType conversion
    // ApplicationUpdateMutationInput
    // update mutation is looser than create mutation so we could do incremental updates
    /*
    const transformForSaving = (
      app: Application
    ): ApplicationCreateMutationInput => {
      console.log("transforming for saving: ", app);
      const appMod: ApplicationCreateMutationInput = {
        additionalInformation: app.additionalInformation,
        applicantType: app.applicantType,
        applicationEvents: app.applicationEvents,
        applicationRoundPk: app.applicationRoundId,
        billingAddress: app.billingAddress,
        contactPerson: app.contactPerson,
        homeCityPk: app.homeCityId,
        organisation: app.organisation,
        pk: app.pk,
        status: app.status,
      };
      tapp.applicationEvents?.forEach((ae, i) => {
        const begin = ae?.begin != null ? uiDateToApiDate(ae.begin) : null;
        const end = ae?.end != null ? uiDateToApiDate(ae.end) : null;
        tapp.applicationEvents[i].begin = begin ?? null;
        tapp.applicationEvents[i].end = end ?? null;
      });
      return appMod;
    };
    */
    const convertPriority = (
      prio: ApplicationEventSchedulePriority
    ): Priority => {
      switch (prio) {
        case 300:
          return Priority.A_300;
        case 200:
          return Priority.A_200;
        case 100:
        default:
          return Priority.A_100;
      }
    };

    const input: ApplicationCreateMutationInput = {
      additionalInformation: appToSave.additionalInformation,
      applicantType: appToSave.applicantType,
      applicationEvents: appToSave.applicationEvents.map((ae) => ({
        ...(ae.begin ? { begin: apiDateToUIDate(ae.begin) } : {}),
        ...(ae.end ? { end: apiDateToUIDate(ae.end) } : {}),
        numPersons: ae.numPersons ?? 0,
        abilityGroup: ae.abilityGroup ?? 0,
        ageGroup: ae.ageGroup ?? 0,
        purpose: ae.purpose ?? 0,
        status: ae.status,
        applicationEventSchedules: ae.applicationEventSchedules
          .filter(
            (
              aes
            ): aes is Omit<typeof aes, "priority"> & {
              priority: ApplicationEventSchedulePriority;
            } => aes.priority != null
          )
          .map((aes) => ({
            day: aes.day,
            begin: aes.begin,
            end: aes.end,
            priority: convertPriority(aes.priority),
          })),
        eventReservationUnits: ae.reservationUnits.map((eru) => ({
          priority: eru.priority,
          reservationUnit: eru.reservationUnitId,
        })),
      })),
      applicationRoundPk: appToSave.applicationRoundId,
      billingAddress: appToSave.billingAddress,
      contactPerson: appToSave.contactPerson,
      homeCityPk: appToSave.homeCityId,
      organisation: appToSave.organisation,
      ...(appToSave.pk != null ? { pk: appToSave.pk } : {}),
      status: appToSave.status,
    };

    const mutation =
      appToSave.pk == null || appToSave.pk === 0 ? create : update;
    const { data } = await mutation({
      variables: {
        input,
      },
    });
    // TODO do a refetch here instead of cache modification (after moving to fetch hook)
    return data?.createApplication?.application?.pk ?? 0;
  };

  // Use the old type for the form and transform it in the mutation
  const saveAndNavigate =
    (path: string) => async (appToSave: ApplicationFormValues) => {
      const id = await handleSave(appToSave);
      const prefix = `/application/${id}`;
      const target = `${prefix}/${path}`;
      clearSelections();
      router.push(target);
    };

  /*
  const [localApplicationEvents, setLocalApplicationEvents] = useState<
    ApplicationEventType[]
  >([]);
  */

  /*
  useEffect(() => {
    if (localApplication?.pk) {
      const events = localApplication.applicationEvents?.filter((ae): ae is NonNullable<typeof ae> => ae != null) ?? [];
      console.log('events: ', events);
      setLocalApplicationEvents(events);
    }
  }, [localApplication]);
  */

  console.log("localApplication: ", localApplication);
  // Modify the laoded application to include localchanges
  const application = localApplication;
  // ? { ...localApplication, applicationEvents: localApplicationEvents
  // Don't think converting the dates is a good idea anymore but this would be the place for it
  // why it's not good? because it breaks the type system (or we have to rewrite the codegen types)
  /* .map((ae) => ({
        application.applicationEvents.forEach((ae, i) => {
          if (ae.end) {
            application.applicationEvents[i].end = apiDateToUIDate(ae.end);
          }
          if (ae.begin) {
            application.applicationEvents[i].begin = apiDateToUIDate(ae.begin);
          }
          }),
        */
  // }
  // : undefined;

  // TODO this needs a proper transformation function from ApplicationType -> Application (form type)
  // TODO application values???
  // TODO need a useEffect for when the API call returns
  const form = useForm<ApplicationFormValues>({
    mode: "onChange",
    defaultValues: {
      applicationEvents: filterNonNullable(application?.applicationEvents).map(
        (ae) => transformApplicationEventToForm(ae)
      ),
      organisation: convertOrganisation(application?.organisation),
      contactPerson: convertPerson(application?.contactPerson),
      billingAddress: convertAddress(application?.billingAddress),
      additionalInformation: application?.additionalInformation ?? "",
      homeCityId: application?.homeCity?.pk ?? undefined,
    },
  });

  const { getValues, reset } = form;

  // TODO this is problematic since we are dynamically adding and removing events and that modifies the application
  // the logic for adding should be inside the form not a custom effect
  // TODO combine the defaultValues and reset (single transformation function)
  useEffect(() => {
    if (application) {
      reset({
        applicationEvents: filterNonNullable(
          application?.applicationEvents
        ).map((ae) => transformApplicationEventToForm(ae)),
        organisation: convertOrganisation(application?.organisation),
        contactPerson: convertPerson(application?.contactPerson),
        billingAddress: convertAddress(application?.billingAddress),
        additionalInformation: application?.additionalInformation ?? "",
        homeCityId: application?.homeCity?.pk ?? undefined,
      });
    }
  }, [application, reset]);

  const handleRemoveUnsavedApplicationEvent = () => {
    /* TODO use form instead
    // TODO can we be sure that the last element is the new one? for now at least we can
    setLocalApplicationEvents((prev) => prev.slice(0, -1));
    */
  };

  const handleNewApplicationEvent = () => {
    if (application?.pk == null) {
      throw new Error("Application id is missing");
    }
    // TODO what is the purpose of this time section?
    const begin = applicationRound?.reservationPeriodBegin;
    const end = applicationRound?.reservationPeriodEnd;
    const params = {
      begin: begin ? apiDateToUIDate(begin) : "",
      end: end ? apiDateToUIDate(end) : "",
    };
    /* FIXME use the form here (register new applicationEvent)
    setLocalApplicationEvents([
      ...localApplicationEvents,
      createApplicationEvent(application.pk, params?.begin, params?.end),
    ]);
    */
    // TODO do we need to keep this also?
    // nextState.applicationEvents = nextState.application.applicationEvents.map((ae) => ae.id as number)
  };

  const applicationRoundName =
    applicationRound != null ? getTranslation(applicationRound, "name") : "-";

  // TODO the error needs to be in a top level component (wrapping this) or use context / toasts
  if (isLoading) {
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

  const handleApplicationFinished = () => {
    // TODO get the form context here and send the form
    saveAndNavigate("sent")(getValues());
  };

  // const rerender = false; // localApplicationEvents.length; // rerender every time event count is changed so that form state stays in sync

  console.log("application", application);
  // For now FIXME (we need special handling for the first element)
  // or we need checks down the line to handle 0 length arrays
  if (
    !application ||
    application.applicationEvents == null ||
    application.applicationEvents?.length === 0
  ) {
    return null;
  }

  return (
    <FormProvider {...form}>
      {pageId === "page1" && (
        <ApplicationPageWrapper
          // key={rerender}
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
              save={(data) => handleSave(data.application)}
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
          <Page2 application={application} onNext={saveAndNavigate("page3")} />
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
            onNext={handleApplicationFinished}
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
    </FormProvider>
  );
};

export default ApplicationRootPage;
