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
import { getTranslation } from "@/modules/util";
import {
  type ApplicationFormValues,
  transformApplication,
  convertApplication,
  ApplicationFormSchemaRefined,
} from "@/components/application/form";
import { useReservationUnitList } from "@/hooks";
import { useApplicationUpdate } from "@/hooks/useApplicationUpdate";
import { getCommonServerSideProps } from "@/modules/serverUtils";
import { base64encode } from "common/src/helpers";
import { createApolloClient } from "@/modules/apolloClient";
import {
  ApplicationDocument,
  type ApplicationQuery,
  type ApplicationQueryVariables,
} from "@/gql/gql-types";
import { getApplicationPath } from "@/modules/urls";
import { useDisplayError } from "@/hooks/useDisplayError";

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
  const pk = Number.isNaN(Number(id)) ? null : Number(id);

  const commonProps = getCommonServerSideProps();
  if (pk == null) {
    return {
      props: {
        ...commonProps,
        notFound: true,
        slug: slug ?? "page1",
        ...(await serverSideTranslations(locale ?? "fi")),
      },
      notFound: true,
    };
  }

  const client = createApolloClient(commonProps.apiBaseUrl, ctx);
  const typename = "ApplicationNode";
  const { data } = await client.query<
    ApplicationQuery,
    ApplicationQueryVariables
  >({
    query: ApplicationDocument,
    variables: {
      id: base64encode(`${typename}:${pk}`),
    },
  });

  // Pass the application and round as props because we don't need to hydrate
  // and our codegen would allow undefineds if we passed data instead.
  const { application } = data;

  const applicationRound = application?.applicationRound ?? undefined;
  if (application == null || applicationRound == null) {
    return {
      props: {
        ...commonProps,
        notFound: true,
        slug: slug ?? "page1",
        ...(await serverSideTranslations(locale ?? "fi")),
      },
      notFound: true,
    };
  }

  return {
    props: {
      ...commonProps,
      slug: slug ?? "page1",
      ...(await serverSideTranslations(locale ?? "fi")),
      data: {
        application,
        applicationRound,
      },
    },
  };
}

function ApplicationRootPage({ slug, data }: PropsNarrowed): JSX.Element {
  const { application, applicationRound } = data;
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

  /* TODO removing form reset on page load for now
   * the defaultValues should be enough and seems to work when loading an existing application
   * this page is not saved + refreshed but goes to second page after save.
   * The problem using reset is that it resets the form with development quick refresh,
   * so not a big problem, but if there is no need to use it, it's better to avoid it.
   */

  const applicationRoundName =
    applicationRound != null ? getTranslation(applicationRound, "name") : "-";

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
