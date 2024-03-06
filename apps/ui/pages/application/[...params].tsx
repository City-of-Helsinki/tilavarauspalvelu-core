import React, { useEffect } from "react";
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
  ApplicationFormSchema,
  type ApplicationFormValues,
  transformApplication,
  convertApplication,
} from "@/components/application/Form";
import useReservationUnitsList from "@/hooks/useReservationUnitList";
import { useApplicationUpdate } from "@/hooks/useApplicationUpdate";
import { ErrorToast } from "@/components/common/ErrorToast";
import { useApplicationQuery } from "@/hooks/useApplicationQuery";
import { getCommonServerSideProps } from "@/modules/serverUtils";

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
    useReservationUnitsList();

  const form = useForm<ApplicationFormValues>({
    mode: "onChange",
    defaultValues: convertApplication(application, selectedReservationUnits),
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
      reset(convertApplication(application, resUnits));
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
