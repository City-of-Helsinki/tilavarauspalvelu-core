import React from "react";
import Error from "next/error";
import { FormProvider, useForm } from "react-hook-form";
import { useRouter } from "next/router";
import type { GetServerSidePropsContext } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { zodResolver } from "@hookform/resolvers/zod";
import { ApplicationPageWrapper } from "@/components/application/ApplicationPage";
import { Page1 } from "@/components/application/Page1";
import { Page2 } from "@/components/application/Page2";
import {
  type ApplicationFormValues,
  transformApplication,
  convertApplication,
  ApplicationFormSchemaRefined,
} from "@/components/application/form";
import { useReservationUnitList } from "@/hooks";
import { useApplicationUpdate } from "@/hooks/useApplicationUpdate";
import { getCommonServerSideProps } from "@/modules/serverUtils";
import { base64encode, toNumber } from "common/src/helpers";
import { createApolloClient } from "@/modules/apolloClient";
import {
  ApplicationDocument,
  type ApplicationQuery,
  type ApplicationQueryVariables,
} from "@/gql/gql-types";
import { getApplicationPath } from "@/modules/urls";
import { useDisplayError } from "@/hooks/useDisplayError";
import {
  convertLanguageCode,
  getTranslationSafe,
} from "common/src/common/util";
import { useTranslation } from "next-i18next";

// TODO move this to a shared file
// and combine all the separate error handling functions to one
type Props = Awaited<ReturnType<typeof getServerSideProps>>["props"];
type PropsNarrowed = Exclude<Props, { notFound: boolean }>;

export async function getServerSideProps(ctx: GetServerSidePropsContext) {
  const { locale } = ctx;

  // TODO should fetch on SSR but we need authentication for it
  const { query } = ctx;
  const { params } = query;
  const [id, slug] = params ?? [];
  const pk = toNumber(id);

  const commonProps = getCommonServerSideProps();
  const notFound = {
    props: {
      ...commonProps,
      notFound: true,
      ...(await serverSideTranslations(locale ?? "fi")),
    },
    notFound: true,
  };
  if (pk == null) {
    return notFound;
  }

  const client = createApolloClient(commonProps.apiBaseUrl, ctx);
  const { data } = await client.query<
    ApplicationQuery,
    ApplicationQueryVariables
  >({
    query: ApplicationDocument,
    variables: {
      id: base64encode(`ApplicationNode:${pk}`),
    },
  });
  const { application } = data;
  if (application == null) {
    return notFound;
  }

  return {
    props: {
      ...commonProps,
      slug,
      application,
      ...(await serverSideTranslations(locale ?? "fi")),
    },
  };
}

function ApplicationRootPage({
  slug,
  application,
}: PropsNarrowed): JSX.Element {
  const { applicationRound } = application;
  const router = useRouter();

  const [update] = useApplicationUpdate();

  const dislayError = useDisplayError();

  const handleSave = async (appToSave: ApplicationFormValues) => {
    // There should not be a situation where we are saving on this page without an application
    // but because of loading we might not have it when the page is rendered
    if (appToSave.pk === 0) {
      // eslint-disable-next-line no-console
      console.error("application pk is 0");
      return 0;
    }
    return update(transformApplication(appToSave));
  };

  const saveAndNavigate =
    (path: "page2" | "page3") => async (appToSave: ApplicationFormValues) => {
      try {
        const pk = await handleSave(appToSave);
        if (pk === 0) {
          return;
        }
        router.push(getApplicationPath(pk, path));
      } catch (e) {
        dislayError(e);
      }
    };

  const { reservationUnits: selectedReservationUnits } =
    useReservationUnitList(applicationRound);

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

  const { i18n } = useTranslation();

  const lang = convertLanguageCode(i18n.language);
  const applicationRoundName =
    applicationRound != null
      ? getTranslationSafe(applicationRound, "name", lang)
      : "-";

  return (
    <FormProvider {...form}>
      {slug === "page1" ? (
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
      ) : slug === "page2" ? (
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

export default ApplicationRootPage;
