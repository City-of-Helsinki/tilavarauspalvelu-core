import React from "react";
import { ApolloError } from "@apollo/client";
import Error from "next/error";
import { FormProvider, useForm } from "react-hook-form";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";
import type { GetServerSidePropsContext } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { zodResolver } from "@hookform/resolvers/zod";
import type {
  ApplicationNode,
  ApplicationRoundNode,
} from "common/types/gql-types";
import { ApplicationPageWrapper } from "@/components/application/ApplicationPage";
import { Page1 } from "@/components/application/Page1";
import Page2 from "@/components/application/Page2";
import { CenterSpinner } from "@/components/common/common";
import { getTranslation } from "@/modules/util";
import {
  type ApplicationFormValues,
  transformApplication,
  convertApplication,
  ApplicationFormSchemaRefined,
} from "@/components/application/Form";
import useReservationUnitsList from "@/hooks/useReservationUnitList";
import { useApplicationUpdate } from "@/hooks/useApplicationUpdate";
import { ErrorToast } from "@/components/common/ErrorToast";
import { useApplicationQuery } from "@/hooks/useApplicationQuery";
import { getCommonServerSideProps } from "@/modules/serverUtils";

// TODO move this to a shared file
// and combine all the separate error handling functions to one
function getErrorMessages(error: unknown): string {
  if (error == null) {
    return "";
  }
  if (error instanceof ApolloError) {
    const { graphQLErrors, networkError } = error;
    if (networkError != null) {
      if ("result" in networkError) {
        if (typeof networkError.result === "string") {
          return networkError.result;
        }
        if ("errors" in networkError.result) {
          // TODO match to known error messages
          // fallback to return unkown backend validation error (different from other unknown errors)
          const { errors } = networkError.result;
          // TODO separate validation errors: this is invalid MutationInput (probably a bug)
          const VALIDATION_ERROR = "Variable '$input'";
          const isValidationError =
            errors.find((e: unknown) => {
              if (typeof e !== "object" || e == null) {
                return false;
              }
              if ("message" in e && typeof e.message === "string") {
                return e.message.startsWith(VALIDATION_ERROR);
              }
              return false;
            }) != null;
          if (isValidationError) {
            return "Validation error";
          }
          return "Unknown network error";
        }
      }
      return networkError.message;
    }
    if (graphQLErrors.length > 0) {
      // TODO separate validation errors: this is invalid form values (user error)
      const MUTATION_ERROR_CODE = "MUTATION_VALIDATION_ERROR";
      const isMutationError =
        graphQLErrors.find((e) => {
          if (e.extensions == null) {
            return false;
          }
          return e.extensions.code === MUTATION_ERROR_CODE;
        }) != null;
      // Possible mutations errors (there are others too)
      // 1. message: "Voi hakea vain 1-7 varausta viikossa."
      //  - code: "invalid"
      // 2. message: "Reservations begin date cannot be before the application round's reservation period begin date."
      //  - code: ""
      if (isMutationError) {
        return "Form validation error";
      }
      return "Unknown GQL error";
    }
  }
  if (typeof error === "string") {
    return error;
  }
  if (typeof error === "object" && "message" in error) {
    if (typeof error.message === "string") {
      return error.message;
    }
  }
  return "Unknown error";
}

type Props = Awaited<ReturnType<typeof getServerSideProps>>["props"];
type PropsNarrowed = Exclude<Props, { notFound: boolean }>;

export async function getServerSideProps(ctx: GetServerSidePropsContext) {
  const { locale } = ctx;

  // TODO should fetch on SSR but we need authentication for it
  const { query } = ctx;
  const { params } = query;
  const [id, slug] = params ?? [];
  const pk = Number.isNaN(Number(id)) ? null : Number(id);

  if (pk == null) {
    return {
      props: {
        ...getCommonServerSideProps(),
        notFound: true,
        slug,
        ...(await serverSideTranslations(locale ?? "fi")),
      },
      notFound: true,
    };
  }

  return {
    props: {
      ...getCommonServerSideProps(),
      key: locale,
      pk,
      slug,
      ...(await serverSideTranslations(locale ?? "fi")),
    },
  };
}

function ApplicationRootPage({
  application,
  applicationRound,
  pageId,
}: {
  application: ApplicationNode;
  applicationRound: ApplicationRoundNode;
  pageId: string;
}): JSX.Element | null {
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
    useReservationUnitsList(applicationRound);

  const begin = new Date(applicationRound.reservationPeriodBegin);
  const end = new Date(applicationRound.reservationPeriodEnd);
  const form = useForm<ApplicationFormValues>({
    mode: "onChange",
    defaultValues: convertApplication(application, selectedReservationUnits),
    resolver: zodResolver(ApplicationFormSchemaRefined({ begin, end })),
  });

  const {
    formState: { isDirty },
  } = form;

  const { t } = useTranslation();

  /* TODO removing form reset on page load for now
   * the defaultValues should be enough and seems to work when loading an existing application
   * this page is not saved + refreshed but goes to second page after save.
   * The problem using reset is that it resets the form with development quick refresh,
   * so not a big problem, but if there is no need to use it, it's better to avoid it.
   */

  const applicationRoundName =
    applicationRound != null ? getTranslation(applicationRound, "name") : "-";

  const errorMessage = getErrorMessages(error);
  const errorTranslated =
    errorMessage !== "" ? t(`errors:applicationMutation.${errorMessage}`) : "";

  return (
    <FormProvider {...form}>
      {errorTranslated !== "" && <ErrorToast error={errorTranslated} />}
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
}

function ApplicationPageWithQuery({
  pk,
  slug,
}: PropsNarrowed): JSX.Element | null {
  const router = useRouter();
  const { t } = useTranslation();

  const { application, error, isLoading } = useApplicationQuery(
    pk ?? undefined
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

  if (pk == null) {
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
}

export default ApplicationPageWithQuery;
