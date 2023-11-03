import React, { useEffect } from "react";
import Error from "next/error";
import { FormProvider, useForm } from "react-hook-form";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";
import { type GetServerSideProps } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { zodResolver } from "@hookform/resolvers/zod";
import type {
  ApplicationUpdateMutationInput,
  ApplicationNode,
  ApplicationRoundNode,
} from "common/types/gql-types";
import { ApplicationEventSchedulePriority } from "common";
import { filterNonNullable } from "common/src/helpers";
import { toApiDate } from "common/src/common/util";
import { Maybe } from "graphql/jsutils/Maybe";
import { redirectProtectedRoute } from "@/modules/protectedRoute";
import { ApplicationPageWrapper } from "@/components/application/ApplicationPage";
import Page1 from "@/components/application/Page1";
import Page2 from "@/components/application/Page2";
import { CenterSpinner } from "@/components/common/common";
import { fromUIDate, getTranslation } from "@/modules/util";
import {
  ApplicationFormSchema,
  type ApplicationFormValues,
  transformApplicationEventToForm,
  convertApplicantType,
} from "@/components/application/Form";
import useReservationUnitsList, {
  type ReservationUnitUnion,
} from "@/hooks/useReservationUnitList";
import { useApplicationUpdate } from "@/hooks/useApplicationUpdate";
import { ErrorToast } from "@/components/common/ErrorToast";
import { useApplicationQuery } from "@/hooks/useApplicationQuery";

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const { locale } = ctx;

  const redirect = redirectProtectedRoute(ctx);
  if (redirect) {
    return redirect;
  }

  // TODO should fetch on SSR but we need authentication for it
  const { query } = ctx;
  const { params } = query;
  const [id, slug] = params ?? [];
  const pk = Number.isNaN(Number(id)) ? null : Number(id);

  return {
    props: {
      key: locale,
      id: pk,
      slug,
      ...(await serverSideTranslations(locale ?? "fi")),
    },
  };
};

const transformDateString = (date?: string | null): string | undefined =>
  date != null && toApiDate(fromUIDate(date)) != null
    ? toApiDate(fromUIDate(date))
    : undefined;

// For pages 1 and 2
const transformApplication = (
  values: ApplicationFormValues
): ApplicationUpdateMutationInput => {
  return {
    pk: values.pk,
    applicantType: values.applicantType,
    applicationEvents: filterNonNullable(values.applicationEvents).map(
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
        eventReservationUnits: ae.reservationUnits?.map((eruPk, eruIndex) => ({
          priority: eruIndex,
          reservationUnit: eruPk,
        })),
      })
    ),
  };
};

const convertApplicationToForm = (
  app: Maybe<ApplicationNode> | undefined,
  reservationUnits: ReservationUnitUnion[]
): ApplicationFormValues => {
  const formAes = filterNonNullable(app?.applicationEvents).map((ae) =>
    transformApplicationEventToForm(ae)
  );
  // TODO do we need to set default values?
  const defaultAes: typeof formAes[0] = {
    pk: undefined,
    name: "",
    formKey: "event-NEW",
    numPersons: 0,
    abilityGroup: undefined,
    ageGroup: 0,
    purpose: 0,
    minDuration: 0,
    maxDuration: 0,
    begin: undefined,
    end: undefined,
    biweekly: false,
    eventsPerWeek: 1,
    applicationEventSchedules: [],
    reservationUnits: reservationUnits
      .map((ru) => ru.pk)
      .filter((pk): pk is number => pk != null),
    accordianOpen: true,
  };
  return {
    pk: app?.pk ?? 0,
    applicantType: convertApplicantType(app?.applicantType),
    applicationEvents: formAes.length > 0 ? formAes : [defaultAes],
  };
};

const ApplicationRootPage = ({
  application,
  applicationRound,
  pageId,
}: {
  application: ApplicationNode;
  applicationRound: ApplicationRoundNode;
  pageId: string;
}): JSX.Element | null => {
  const router = useRouter();

  const [update, { error }] = useApplicationUpdate();

  const handleSave = async (appToSave: ApplicationFormValues) => {
    // There should not be a situation where we are saving on this page without an application
    // but because of loading we might not have it when the page is rendered
    if (appToSave.pk === 0) {
      // eslint-disable-next-line no-console
      console.error("application pk is 0");
      return 0;
    }

    const input = transformApplication(appToSave);
    const pk = await update(input);
    return pk;
  };

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

  const { reservationUnits: selectedReservationUnits } =
    useReservationUnitsList();

  const form = useForm<ApplicationFormValues>({
    mode: "onChange",
    defaultValues: convertApplicationToForm(
      application,
      selectedReservationUnits
    ),
    resolver: zodResolver(ApplicationFormSchema),
  });

  const {
    reset,
    formState: { isDirty },
  } = form;

  useEffect(() => {
    if (application != null) {
      const unitsInApplicationRound =
        applicationRound?.reservationUnits?.map((ru) => ru.pk) ?? [];
      const resUnits = selectedReservationUnits.filter(
        (ru) => ru?.pk != null && unitsInApplicationRound.includes(ru.pk)
      );
      reset(convertApplicationToForm(application, resUnits));
    }
  }, [
    application,
    applicationRound?.reservationUnits,
    reset,
    selectedReservationUnits,
  ]);

  const applicationRoundName =
    applicationRound != null ? getTranslation(applicationRound, "name") : "-";

  return (
    <FormProvider {...form}>
      {error && <ErrorToast error="ApolloError" />}
      {pageId === "page1" ? (
        <ApplicationPageWrapper
          overrideText={applicationRoundName}
          translationKeyPrefix="application:Page1"
          application={application}
          isDirty={isDirty}
        >
          <Page1
            applicationRound={applicationRound}
            onNext={saveAndNavigate("page2")}
          />
        </ApplicationPageWrapper>
      ) : pageId === "page2" ? (
        <ApplicationPageWrapper
          translationKeyPrefix="application:Page2"
          application={application}
          isDirty={isDirty}
        >
          <Page2 application={application} onNext={saveAndNavigate("page3")} />
        </ApplicationPageWrapper>
      ) : (
        <Error statusCode={404} />
      )}
    </FormProvider>
  );
};

const ApplicationPageWithQuery = ({
  id,
  slug,
}: {
  id: number | null;
  slug: string;
}): JSX.Element | null => {
  const router = useRouter();
  const { t } = useTranslation();

  const { application, error, isLoading } = useApplicationQuery(
    id ?? undefined
  );

  if (error != null) {
    // eslint-disable-next-line no-console
    console.error("applications query failed: ", error);
    return (
      <ErrorToast
        error={`${t("common:error.dataError")}`}
        onClose={() => router.reload()}
      />
    );
  }

  const applicationRound = application?.applicationRound ?? undefined;

  if (id == null) {
    return <Error statusCode={404} />;
  }
  if (isLoading) {
    return <CenterSpinner />;
  }
  if (application == null || applicationRound == null) {
    return <Error statusCode={404} />;
  }

  return (
    <ApplicationRootPage
      application={application}
      pageId={slug}
      applicationRound={applicationRound}
    />
  );
};

export default ApplicationPageWithQuery;
