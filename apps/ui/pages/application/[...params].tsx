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
  ApplicationStatusChoice,
  ApplicationsApplicationApplicantTypeChoices,
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
import { View } from "@/components/application/View";
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
import type { StepperProps } from "@/components/application/Stepper";
import useReservationUnitsList from "@/hooks/useReservationUnitList";

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

// There is an issue with the type of the data returned by the query (double enums with same values)
const convertApplicantType = (
  type: Maybe<ApplicationsApplicationApplicantTypeChoices> | undefined
): Applicant_Type => {
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
      return Applicant_Type.Individual;
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

// TODO this should not use form values but the application from the backend
// TODO either option has a problem though
// - change something in the form and the stepper is not updated
// - nor does it ask for confirmation when navigating away nor does it save the form
// For now the Stepper has an alert and blocks navigation if form is modified
// TODO this should have more complete checks (but we are thinking of splitting the form anyway)
const calculateCompletedStep = (
  status: Maybe<ApplicationStatusChoice> | undefined,
  values: ApplicationFormValues
): 0 | 1 | 2 | 3 | 4 => {
  // 4 should only be returned if the application state === Received
  if (status === ApplicationStatusChoice.Received) {
    return 4;
  }

  // 3 if the user information is filled
  if (
    (values.billingAddress?.streetAddress &&
      values.applicantType === Applicant_Type.Individual) ||
    values.contactPerson == null
  ) {
    return 3;
  }

  // 2 only if application events have time schedules
  if (
    values.applicationEvents?.length &&
    values.applicationEvents.length > 0 &&
    values.applicationEvents?.find((x) => x?.applicationEventSchedules.length)
  ) {
    return 2;
  }

  // First page is valid
  if (values.applicationEvents?.[0]?.reservationUnits?.length
    && values.applicationEvents?.[0]?.begin != null && values.applicationEvents?.[0]?.end != null
    && values.applicationEvents?.[0]?.name != "" && values.applicationEvents?.[0]?.numPersons != null
    && values.applicationEvents?.[0]?.numPersons > 0
    && values.applicationEvents?.[0]?.purpose != null
  ) {
    return 1;
  }
  return 0;
};

// TODO when coming to this for the first time we should have a list of reservation units the user selected
// this used to be in the old version but isn't working right now
// this seems to have been sticky in the old one (i.e. remove the partial application event, and recreate it the units are still there)
// TODO also there should always be one application event created in a new form (and it's not possible to save without at least one)
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
      applicantType: appToSave.applicantType,
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
          ...(ae.abilityGroup != null ? { abilityGroup: ae.abilityGroup } : {}),
          ...(ae.ageGroup != null ? { ageGroup: ae.ageGroup } : {}),
          ...(ae.purpose != null ? { purpose: ae.purpose } : {}),
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
      ...(appToSave.hasBillingAddress ||
      appToSave.applicantType === Applicant_Type.Individual
        ? { billingAddress: transformAddress(appToSave.billingAddress) }
        : {}),
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

  const formAes = filterNonNullable(application?.applicationEvents).map(
        (ae) => transformApplicationEventToForm(ae)
      )
  const form = useForm<ApplicationFormValues>({
    mode: "onChange",
    defaultValues: {
      pk: application?.pk ?? undefined,
      applicantType: convertApplicantType(application?.applicantType),
      // TODO do we need to get the applicationRoundId from somewhere else?
      applicationRoundId: applicationRound?.pk ?? undefined,
      applicationEvents: formAes.length > 0 ? formAes : [
        {
          // TODO do we need to set default values?
          pk: undefined,
          name: "",
          numPersons: 0,
          abilityGroup: undefined,
          ageGroup: undefined,
          purpose: undefined,
          minDuration: 0,
          maxDuration: 0,
          begin: undefined,
          end: undefined,
          biweekly: false,
          eventsPerWeek: 1,
          applicationEventSchedules: [],
          // TODO get the selected from the hook
          reservationUnits: [],
        },
      ],
      organisation: convertOrganisation(application?.organisation),
      contactPerson: convertPerson(application?.contactPerson),
      billingAddress: convertAddress(application?.billingAddress),
      hasBillingAddress:
        application?.applicantType !==
          ApplicationsApplicationApplicantTypeChoices.Individual &&
        application?.billingAddress?.streetAddress != null,
      additionalInformation: application?.additionalInformation ?? "",
      homeCityId: application?.homeCity?.pk ?? undefined,
    },
    resolver: zodResolver(ApplicationFormSchema),
  });

  const {
    reset,
    getValues,
    formState: { isDirty },
  } = form;

  const { reservationUnits: selectedReservationUnits } = useReservationUnitsList();
  // TODO combine the defaultValues and reset (single transformation function)
  useEffect(() => {
    reset({
      pk: application?.pk ?? undefined,
      applicantType: convertApplicantType(application?.applicantType),
      // TODO do we need to get the applicationRoundId from somewhere else?
      applicationRoundId: applicationRound?.pk ?? undefined,
      applicationEvents: formAes.length > 0 ? formAes : [
        {
          // TODO do we need to set default values?
          pk: undefined,
          name: "",
          numPersons: 0,
          abilityGroup: undefined,
          ageGroup: undefined,
          purpose: undefined,
          minDuration: 0,
          maxDuration: 0,
          begin: undefined,
          end: undefined,
          accordianOpen: true,
          biweekly: false,
          eventsPerWeek: 1,
          applicationEventSchedules: [],
          // TODO get the selected from the hook
          reservationUnits: filterNonNullable(selectedReservationUnits.map((ru) => ru.pk)),
        },
      ],
      organisation: convertOrganisation(application?.organisation),
      contactPerson: convertPerson(application?.contactPerson),
      billingAddress: convertAddress(application?.billingAddress),
      hasBillingAddress:
        application?.applicantType !==
          ApplicationsApplicationApplicantTypeChoices.Individual &&
        application?.billingAddress?.streetAddress != null,
      additionalInformation: application?.additionalInformation ?? "",
      homeCityId: application?.homeCity?.pk ?? undefined,
    });
  }, [application, applicationRound, reset]);

  const applicationRoundName =
    applicationRound != null ? getTranslation(applicationRound, "name") : "-";

  const pages = ["page1", "page2", "page3", "preview"];
  const steps: StepperProps = {
    steps: pages.map((x, i) => ({ slug: x, step: i })),
    completedStep: calculateCompletedStep(application.status, getValues()),
    basePath: `/application/${application.pk ?? 0}`,
    isFormDirty: isDirty,
  };

  // TODO the inner content can be rewriten as a switch (or use proper file routing instead)
  // the problem of using file routing is that we need to rewrite the forms to be per page instead
  return (
    <FormProvider {...form}>
      {pageId === "page1" && (
        <ApplicationPageWrapper
          overrideText={applicationRoundName}
          translationKeyPrefix="application:Page1"
          steps={steps}
        >
          <Page1 applicationRound={applicationRound} onNext={saveAndNavigate("page2")} />
        </ApplicationPageWrapper>
      )}
      {pageId === "page2" && (
        <ApplicationPageWrapper translationKeyPrefix="application:Page2" steps={steps}>
          <Page2 application={application} onNext={saveAndNavigate("page3")} />
        </ApplicationPageWrapper>
      )}
      {pageId === "page3" && (
        <ApplicationPageWrapper translationKeyPrefix="application:Page3" steps={steps}>
          <Page3 onNext={saveAndNavigate("preview")} />
        </ApplicationPageWrapper>
      )}
      {pageId === "preview" && (
        <ApplicationPageWrapper translationKeyPrefix="application:preview" steps={steps}>
          <Preview application={application} tos={tos} />
        </ApplicationPageWrapper>
      )}
      {pageId === "view" && (
        <ApplicationPageWrapper
          translationKeyPrefix="application:view"
          headContent={applicationRoundName}
          steps={undefined}
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
