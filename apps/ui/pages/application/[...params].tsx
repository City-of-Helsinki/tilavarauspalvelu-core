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
  TermsOfUseType,
  Mutation,
  MutationCreateApplicationArgs,
  MutationUpdateApplicationArgs,
  ApplicationCreateMutationInput,
  Priority,
  ApplicationStatus,
  ApplicationsApplicationApplicantTypeChoices,
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
import Sent from "@/components/application/Sent";
import { CenterSpinner } from "@/components/common/common";
import { apiDateToUIDate, getTranslation } from "@/modules/util";
import { TERMS_OF_USE } from "@/modules/queries/reservationUnit";
import { createApolloClient } from "@/modules/apolloClient";
import {
  ApplicationFormValues,
  OrganisationFormValues,
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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const convertPriority = (prio: ApplicationEventSchedulePriority): Priority => {
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

// remove the identifier if it's empty (otherwise the mutation fails)
const transformOrganisation = ({
  identifier,
  ...rest
}: OrganisationFormValues) => ({
  ...rest,
  ...(identifier != null && identifier !== "" ? { identifier } : {}),
});

// TODO refactor the input data to no include nulls
// TODO use a custom transformation instead of the utility functions
const transformDateString = (date?: string | null): string | undefined =>
  date != null && apiDateToUIDate(date) !== ""
    ? apiDateToUIDate(date)
    : undefined;

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

  const application =
    applicationData?.applications?.edges?.[0]?.node ?? undefined;
  const applicationRound = application?.applicationRound ?? undefined;

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
    // TODO test all variations (update / create) (individual / organisation / company)
    // @ts-expect-error -- For update mutation removing the organisation.identifier is necessary if the organisation doesn't have it
    const input: ApplicationCreateMutationInput = {
      additionalInformation: appToSave.additionalInformation,
      applicantType: appToSave.applicantType,
      applicationEvents: appToSave.applicationEvents.map((ae) => ({
        ...(transformDateString(ae.begin) != null
          ? { begin: transformDateString(ae.begin) }
          : {}),
        ...(transformDateString(ae.end) != null
          ? { end: transformDateString(ae.end) }
          : {}),
        pk: ae.pk,
        numPersons: ae.numPersons ?? 0,
        // these (pks) can never be zero or null in the current version
        // even if there are no abilityGroups in the database...
        // so for now default them to 1 and have another look after the backend change is merged
        abilityGroup: ae.abilityGroup ?? 1,
        ageGroup: ae.ageGroup ?? 1,
        purpose: ae.purpose ?? 1,
        status: ae.status,
        // min / max duration is a weird string format in the API
        minDuration: String(ae.minDuration ?? 0), // "3600" == 1h
        maxDuration: String(ae.maxDuration ?? 0), // "7200" == 2h
        // API Date format (YYYY-MM-DD)
        // not mandatory in the input but what is the default value?
        ...(transformDateString(ae.begin) != null
          ? { begin: transformDateString(ae.begin) }
          : {}),
        ...(transformDateString(ae.end) != null
          ? { end: transformDateString(ae.end) }
          : {}),
        biweekly: ae.biweekly,
        eventsPerWeek: ae.eventsPerWeek,
        applicationEventSchedules: ae.applicationEventSchedules
          .filter(
            (
              aes
            ): aes is Omit<typeof aes, "priority"> & {
              priority: ApplicationEventSchedulePriority;
            } => aes.priority != null
          )
          .map((aes) => {
            return {
              day: aes.day,
              // Time format (HH:MM)
              begin: aes.begin,
              end: aes.end,
              // FIXME priority is not a valid value
              // This seems to be a backend problem (some extra validation that is not in sync with GQL schema)
              // "\"priority.A_300\" ei ole kelvollinen valinta."
              // priority: convertPriority(aes.priority),
            };
          }),
        eventReservationUnits: ae.reservationUnits.map((eruPk, eruIndex) => ({
          priority: eruIndex,
          reservationUnit: eruPk,
        })),
      })),
      applicationRoundPk: appToSave.applicationRoundId,
      ...(appToSave.hasBillingAddress
        ? { billingAddress: appToSave.billingAddress }
        : {}),
      contactPerson: appToSave.contactPerson,
      homeCityPk: appToSave.homeCityId,
      organisation: transformOrganisation(appToSave.organisation),
      ...(appToSave.pk != null ? { pk: appToSave.pk } : {}),
      status: appToSave.status,
    };

    // TODO can this mutation ever be create?
    // since the applications are created on a separate page
    // i.e. can we be on this page with application.pk == null?
    const mutation =
      appToSave.pk == null || appToSave.pk === 0 ? create : update;
    const { data } = await mutation({
      variables: {
        input,
      },
    });
    const errors =
      appToSave.pk == null || appToSave.pk === 0
        ? data?.createApplication?.errors
        : data?.updateApplication?.errors;
    if (errors != null && errors.length > 0) {
      console.error("Error saving application: ", errors);
      // TOOD display to the user
      setError("Error saving application");
      return 0;
    }
    // TODO do a refetch here instead of cache modification (after moving to fetch hook)
    return appToSave.pk ?? data?.createApplication?.application?.pk ?? 0;
  };

  // Use the old type for the form and transform it in the mutation
  const saveAndNavigate =
    (path: string) => async (appToSave: ApplicationFormValues) => {
      const pk = await handleSave(appToSave);
      if (pk === 0) {
        return;
      }
      const prefix = `/application/${pk}`;
      const target = `${prefix}/${path}`;
      router.push(target);
    };

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
      pk: application?.pk ?? undefined,
      status: application?.status ?? ApplicationStatus.Draft,
      applicantType:
        application?.applicantType ??
        ApplicationsApplicationApplicantTypeChoices.Individual,
      // TODO do we need to get the applicationRoundId from somewhere else?
      applicationRoundId: application?.applicationRound?.pk ?? undefined,

      applicationEvents: filterNonNullable(application?.applicationEvents).map(
        (ae) => transformApplicationEventToForm(ae)
      ),
      organisation: convertOrganisation(application?.organisation),
      contactPerson: convertPerson(application?.contactPerson),
      // TODO do we check if the billing address is toggled
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
        pk: application?.pk ?? undefined,
        status: application?.status ?? ApplicationStatus.Draft,
        applicantType:
          application?.applicantType ??
          ApplicationsApplicationApplicantTypeChoices.Individual,
        // TODO do we need to get the applicationRoundId from somewhere else?
        applicationRoundId: application?.applicationRound?.pk ?? undefined,
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
