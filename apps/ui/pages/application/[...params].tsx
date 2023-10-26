import React, { useEffect, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { Notification } from "hds-react";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";
import { type GetServerSideProps } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { zodResolver } from "@hookform/resolvers/zod";
import type {
  Query,
  QueryApplicationsArgs,
  QueryTermsOfUseArgs,
  TermsOfUseType,
  Mutation,
  MutationUpdateApplicationArgs,
  ApplicationUpdateMutationInput,
  ApplicationNode,
  ApplicationRoundNode,
} from "common/types/gql-types";
import {
  Applicant_Type,
  ApplicationsApplicationApplicantTypeChoices,
  ReservationsReservationPriorityChoices,
} from "common/types/gql-types";
import { APPLICATION_QUERY } from "common/src/queries/application";
import { useMutation, useQuery } from "@apollo/client";
import { ApplicationEventSchedulePriority } from "common";
import { filterNonNullable } from "common/src/helpers";
import { toApiDate } from "common/src/common/util";
import { Maybe } from "graphql/jsutils/Maybe";
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
  type AddressFormValues,
  ApplicationFormSchema,
  type ApplicationFormValues,
  type OrganisationFormValues,
  type PersonFormValues,
  convertAddress,
  convertOrganisation,
  convertPerson,
  transformApplicationEventToForm,
} from "@/components/application/Form";
import { UPDATE_APPLICATION_MUTATION } from "@/modules/queries/application";

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

const convertApplicantType = (
  type: Maybe<ApplicationsApplicationApplicantTypeChoices> | undefined
) => {
  switch (type) {
    case ApplicationsApplicationApplicantTypeChoices.Individual:
      return Applicant_Type.Individual;
    case ApplicationsApplicationApplicantTypeChoices.Company:
      return Applicant_Type.Company;
    case ApplicationsApplicationApplicantTypeChoices.Association:
      return Applicant_Type.Association;
    case ApplicationsApplicationApplicantTypeChoices.Community:
      return Applicant_Type.Community;
    default:
      return undefined;
  }
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const convertPriority = (
  prio: ApplicationEventSchedulePriority
): ReservationsReservationPriorityChoices => {
  switch (prio) {
    case 300:
      return ReservationsReservationPriorityChoices.A_300;
    case 200:
      return ReservationsReservationPriorityChoices.A_200;
    case 100:
    default:
      return ReservationsReservationPriorityChoices.A_100;
  }
};

// Filter out any empty strings from the object (otherwise the mutation fails)
const transformPerson = (person?: PersonFormValues) => {
  return {
    firstName: person?.firstName || undefined,
    lastName: person?.lastName || undefined,
    email: person?.email || undefined,
    phoneNumber: person?.phoneNumber || undefined,
  };
};

const transformAddress = (address?: AddressFormValues) => {
  return {
    pk: address?.pk || undefined,
    streetAddress: address?.streetAddress || undefined,
    postCode: address?.postCode || undefined,
    city: address?.city || undefined,
  };
};
// Filter out any empty strings from the object (otherwise the mutation fails)
// remove the identifier if it's empty (otherwise the mutation fails)
const transformOrganisation = (org?: OrganisationFormValues) => {
  // const { identifier, ...rest } = org ?? {};
  return {
    name: org?.name || undefined,
    identifier: org?.identifier || undefined,
    address: transformAddress(org?.address),
  };
};

const transformDateString = (date?: string | null): string | undefined =>
  date != null && toApiDate(fromUIDate(date)) != null
    ? toApiDate(fromUIDate(date))
    : undefined;

const ApplicationRootPage = ({
  application,
  applicationRound,
  pageId,
  tos,
  setError,
}: {
  application: ApplicationNode;
  applicationRound: ApplicationRoundNode;
  pageId: string;
  tos: TermsOfUseType[];
  setError: (error: string | null) => void;
}): JSX.Element | null => {
  const { t } = useTranslation();
  const router = useRouter();

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
    // There should not be a situation where we are saving on this page without an application
    // but because of loading we might not have it when the page is rendered
    // TODO: refactor so we don't need to check it like this
    if (appToSave.pk == null) {
      // eslint-disable-next-line no-console
      console.error("application pk is null");
      return 0;
    }
    if (appToSave.pk === 0) {
      // eslint-disable-next-line no-console
      console.error("application pk is 0");
      return 0;
    }
    // TODO test all variations (individual / organisation / company)
    const input: ApplicationUpdateMutationInput = {
      pk: appToSave.pk,
      additionalInformation: appToSave.additionalInformation,
      applicantType: appToSave.applicantType ?? undefined,
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
          name: ae.name,
          numPersons: ae.numPersons ?? 0,
          // these (pks) can never be zero or null in the current version
          // even if there are no abilityGroups in the database...
          // so for now default them to 1 and have another look after the backend change is merged
          abilityGroup: ae.abilityGroup ?? 1,
          ageGroup: ae.ageGroup ?? 1,
          purpose: ae.purpose ?? 1,
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
            ?.filter(
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
                priority: aes.priority,
              };
            }),
          eventReservationUnits: ae.reservationUnits?.map(
            (eruPk, eruIndex) => ({
              priority: eruIndex,
              reservationUnit: eruPk,
            })
          ),
        })
      ),
      applicationRound: appToSave.applicationRoundId,
      ...(appToSave.hasBillingAddress
        ? { billingAddress: appToSave.billingAddress }
        : {}),
      // TODO check for empty fields and save undefined instead of empty string
      contactPerson: transformPerson(appToSave.contactPerson),
      homeCity: appToSave.homeCityId,
      organisation: transformOrganisation(appToSave.organisation),
      ...(appToSave.pk != null ? { pk: appToSave.pk } : {}),
    };

    try {
      const response = await update({
        variables: {
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
      return appToSave.pk ?? data?.createApplication?.pk ?? 0;
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
      applicantType: convertApplicantType(application?.applicantType),
      // TODO do we need to get the applicationRoundId from somewhere else?
      applicationRoundId: applicationRound?.pk ?? undefined,
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
    reset({
      pk: application?.pk ?? undefined,
      applicantType: convertApplicantType(application?.applicantType),
      // TODO do we need to get the applicationRoundId from somewhere else?
      applicationRoundId: applicationRound?.pk ?? undefined,
      applicationEvents: filterNonNullable(application?.applicationEvents).map(
        (ae) => transformApplicationEventToForm(ae)
      ),
      organisation: convertOrganisation(application?.organisation),
      contactPerson: convertPerson(application?.contactPerson),
      billingAddress: convertAddress(application?.billingAddress),
      additionalInformation: application?.additionalInformation ?? "",
      homeCityId: application?.homeCity?.pk ?? undefined,
    });
  }, [application, applicationRound, reset]);

  const applicationRoundName =
    applicationRound != null ? getTranslation(applicationRound, "name") : "-";

  // TODO refactor this to use the same <form onSubmit /> logic as other parts (not getValues)
  const handleApplicationFinished = () => {
    saveAndNavigate("sent")(getValues());
  };

  // TODO the inner content can be rewriten as a switch (or use proper file routing instead)
  // the problem of using file routing is that we need to rewrite the forms to be per page instead
  return (
    <FormProvider {...form}>
      {pageId === "page1" && (
        <ApplicationPageWrapper
          application={application}
          overrideText={applicationRoundName}
          translationKeyPrefix="application:Page1"
        >
          <Page1
            applicationRound={applicationRound}
            application={application}
            onNext={saveAndNavigate("page2")}
          />
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
    </FormProvider>
  );
};

// TODO these two wrapper components can be refactored to getServersideProps
// Their purpose is to separate the error, query, and routing logic from the form
const ApplicationPageWithQuery = ({
  applicationPk,
  pageId,
  tos,
}: {
  applicationPk: number;
  pageId: string;
  tos: TermsOfUseType[];
}): JSX.Element | null => {
  const [error, setError] = useState<string | null>();
  const router = useRouter();
  const { t } = useTranslation();

  const { data: applicationData, loading: isLoading } = useQuery<
    Query,
    QueryApplicationsArgs
  >(APPLICATION_QUERY, {
    variables: {
      pk: [Number(applicationPk)],
    },
    skip: !applicationPk,
    onError: (e) => {
      console.warn("applications query failed: ", e);
      setError(`${t("common:error.dataError")}`);
    },
  });

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

  const application =
    applicationData?.applications?.edges?.[0]?.node ?? undefined;
  const applicationRound = application?.applicationRound ?? undefined;

  if (application == null || applicationRound == null) {
    return null;
  }

  return (
    <>
      <ApplicationRootPage
        application={application}
        pageId={pageId}
        tos={tos}
        applicationRound={applicationRound}
        setError={setError}
      />
      {error != null && (
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
      )}
    </>
  );
};

const ApplicationPageRouted = ({
  tos,
}: {
  tos: TermsOfUseType[];
}): JSX.Element | null => {
  // TODO router could be turned to SSR prop
  const router = useRouter();
  const [applicationId, pageId] = router.query?.params as string[];

  // TODO proper errors
  if (!applicationId || !pageId) {
    return <div>Error: missing page path or id</div>;
  }
  if (Number.isNaN(Number(applicationId))) {
    return <div>Error: not a number</div>;
  }
  return (
    <ApplicationPageWithQuery
      applicationPk={Number(applicationId)}
      pageId={pageId}
      tos={tos}
    />
  );
};

export default ApplicationPageRouted;
