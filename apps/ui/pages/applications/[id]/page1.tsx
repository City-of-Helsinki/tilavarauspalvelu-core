import React from "react";
import { FormProvider, useForm } from "react-hook-form";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";
import type { GetServerSidePropsContext } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { zodResolver } from "@hookform/resolvers/zod";
import { ApplicationPageWrapper } from "@/components/application/ApplicationPage";
import { Page1 as Page1Impl } from "@/components/application/Page1";
import {
  type ApplicationPage1FormValues,
  ApplicationPage1SchemaRefined,
  transformApplicationPage1,
  convertApplicationPage1,
} from "@/components/application/form";
import { useReservationUnitList } from "@/hooks";
import { useApplicationUpdate } from "@/hooks/useApplicationUpdate";
import { getCommonServerSideProps } from "@/modules/serverUtils";
import { base64encode, ignoreMaybeArray, toNumber } from "common/src/helpers";
import { createApolloClient } from "@/modules/apolloClient";
import {
  ApplicationDocument,
  type ApplicationQuery,
  type ApplicationQueryVariables,
} from "@/gql/gql-types";
import { getApplicationPath } from "@/modules/urls";
import {
  convertLanguageCode,
  getTranslationSafe,
} from "common/src/common/util";
import { useDisplayError } from "@/hooks/useDisplayError";

function Page1({ application }: PropsNarrowed): JSX.Element {
  const { applicationRound } = application;
  const router = useRouter();
  const { i18n } = useTranslation();
  const [update] = useApplicationUpdate();
  const dislayError = useDisplayError();

  const handleSave = async (values: ApplicationPage1FormValues) => {
    return update(transformApplicationPage1(values));
  };

  const saveAndNavigate = async (values: ApplicationPage1FormValues) => {
    try {
      const pk = await handleSave(values);
      router.push(getApplicationPath(pk, "page2"));
    } catch (err) {
      dislayError(err);
    }
  };

  const { reservationUnits: selectedReservationUnits } =
    useReservationUnitList(applicationRound);

  const begin = new Date(applicationRound.reservationPeriodBegin);
  const end = new Date(applicationRound.reservationPeriodEnd);
  const form = useForm<ApplicationPage1FormValues>({
    mode: "onChange",
    defaultValues: convertApplicationPage1(
      application,
      selectedReservationUnits
    ),
    resolver: zodResolver(ApplicationPage1SchemaRefined({ begin, end })),
  });

  const {
    formState: { isDirty },
  } = form;

  const lang = convertLanguageCode(i18n.language);
  const applicationRoundName = getTranslationSafe(
    applicationRound,
    "name",
    lang
  );

  return (
    <FormProvider {...form}>
      <ApplicationPageWrapper
        overrideText={applicationRoundName}
        translationKeyPrefix="application:Page1"
        application={application}
        isDirty={isDirty}
      >
        <Page1Impl
          applicationRound={applicationRound}
          onNext={saveAndNavigate}
        />
      </ApplicationPageWrapper>
    </FormProvider>
  );
}

type Props = Awaited<ReturnType<typeof getServerSideProps>>["props"];
type PropsNarrowed = Exclude<Props, { notFound: boolean }>;

export async function getServerSideProps(ctx: GetServerSidePropsContext) {
  const { locale, query } = ctx;
  const pk = toNumber(ignoreMaybeArray(query.id));

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
      application,
      ...(await serverSideTranslations(locale ?? "fi")),
    },
  };
}

export default Page1;
