import React, { useEffect, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { Notification } from "hds-react";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";
import { GetServerSideProps } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Query,
  QueryApplicationsArgs,
  QueryTermsOfUseArgs,
  TermsOfUseType,
  Mutation,
  MutationCreateApplicationArgs,
  MutationUpdateApplicationArgs,
  Priority,
  ApplicationStatus,
  ApplicationsApplicationApplicantTypeChoices,
  ApplicationUpdateMutationInput,
} from "common/types/gql-types";
import { APPLICATION_QUERY } from "common/src/queries/application";
import { gql, useMutation, useQuery } from "@apollo/client";
import { ApplicationEventSchedulePriority } from "common";
import { filterNonNullable } from "common/src/helpers";
import { toApiDate } from "common/src/common/util";
import { redirectProtectedRoute } from "@/modules/protectedRoute";
import { ApplicationPageWrapper } from "@/components/application/ApplicationPage";
import Page1 from "@/components/application/Page1";
import Page2 from "@/components/application/Page2";
import Page3 from "@/components/application/Page3";
import { Preview } from "@/components/application/Preview";
import View from "@/components/application/View";
import Sent from "@/components/application/Sent";
import { CenterSpinner } from "@/components/common/common";
import { fromUIDate, getTranslation } from "@/modules/util";
import { TERMS_OF_USE } from "@/modules/queries/reservationUnit";
import { createApolloClient } from "@/modules/apolloClient";
import {
  ApplicationFormSchema,
  ApplicationFormValues,
  OrganisationFormValues,
  convertAddress,
  convertOrganisation,
  convertPerson,
  transformApplicationEventToForm,
} from "@/components/application/Form";
import { CREATE_APPLICATION_MUTATION, UPDATE_APPLICATION_MUTATION } from "@/modules/queries/application";

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
  date != null && toApiDate(fromUIDate(date)) != null
    ? toApiDate(fromUIDate(date))
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
    const input: ApplicationUpdateMutationInput = {
      additionalInformation: appToSave.additionalInformation,
      applicantType:
        appToSave.applicantType ??
        ApplicationsApplicationApplicantTypeChoices.Individual,
      // FIXME this includes nulls which are not allowed in the mutation
      // if we unregister the applicationEvent
      applicationEvents: filterNonNullable(appToSave.applicationEvents).map(
        (ae) => ({
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
        })
      ),
      applicationRoundPk: appToSave.applicationRoundId,
      ...(appToSave.hasBillingAddress
        ? { billingAddress: appToSave.billingAddress }
        : {}),
      contactPerson: appToSave.contactPerson ?? { firstName: "", lastName: "" },
      homeCityPk: appToSave.homeCityId,
      organisation:
        appToSave.organisation != null
          ? transformOrganisation(appToSave.organisation)
          : undefined,
      ...(appToSave.pk != null ? { pk: appToSave.pk } : {}),
      status: appToSave.status,
    };

    // TODO can this mutation ever be create?
    // since the applications are created on a separate page
    // i.e. can we be on this page with application.pk == null?
    const mutation =
      appToSave.pk == null || appToSave.pk === 0 ? create : update;
    try {
      const response = await mutation({
        variables: {
          // @ts-expect-error -- TODO see if we ever use create mutation
          input,
        },
      });
      // TODO cleanup the error handling
      // TODO translate errors
      const { data, errors } = response;
      const mutErrors =
        appToSave.pk == null || appToSave.pk === 0
          ? data?.createApplication?.errors
          : data?.updateApplication?.errors;
      if (errors != null) {
        console.error("Error saving application: ", errors);
        // TOOD display to the user
        setError("Error saving application");
        return 0;
      }
      if (mutErrors != null) {
        console.error("Mutation error saving application: ", errors);
        // TOOD display to the user
        setError("Mutation error saving application");
        return 0;
      }
      // TODO do a refetch here instead of cache modification (after moving to fetch hook)
      return appToSave.pk ?? data?.createApplication?.application?.pk ?? 0;
    } catch (e) {
      console.error("Error thrown while saving application: ", e);
      setError("Error thrown while saving application");
      return 0;
    }
  };

  // Use the old type for the form and transform it in the mutation
  // TODO don't create functions?
  const saveAndNavigate =
    (path: string) => async (appToSave: ApplicationFormValues) => {
      // FIXME this somehow manages to change the page even though the mutation fails
      // Page1 (invalid applicationEvents array)
      const pk = await handleSave(appToSave);
      if (pk === 0) {
        console.error("Error saving application");
        return;
      }
      console.log("saveAndNavigate", pk, path);
      const prefix = `/application/${pk}`;
      const target = `${prefix}/${path}`;
      router.push(target);
    };

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
    resolver: zodResolver(ApplicationFormSchema),
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

  if (!application || application.applicationEvents == null) {
    return null;
  }

  return (
    <FormProvider {...form}>
      {pageId === "page1" && (
        <ApplicationPageWrapper
          application={application}
          overrideText={applicationRoundName}
          translationKeyPrefix="application:Page1"
        >
          {applicationRound != null && (
            <Page1
              applicationRound={applicationRound}
              application={application}
              onNext={saveAndNavigate("page2")}
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
