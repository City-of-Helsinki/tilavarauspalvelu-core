import React from "react";
import { FormProvider, useForm } from "react-hook-form";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";
import type { GetServerSidePropsContext } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  base64encode,
  filterNonNullable,
  ignoreMaybeArray,
  toNumber,
} from "common/src/helpers";
import {
  convertLanguageCode,
  getTranslationSafe,
} from "common/src/common/util";
import { useDisplayError } from "common/src/hooks";
import { Flex } from "common/styled";
import { uniq } from "lodash-es";
import { gql } from "@apollo/client";
import { createApolloClient } from "@/modules/apolloClient";
import {
  ApplicationPage1Document,
  UnitOrderingChoices,
  useUpdateApplicationMutation,
  type ApplicationPage1Query,
  type ApplicationPage1QueryVariables,
} from "@/gql/gql-types";
import { getApplicationPath } from "@/modules/urls";
import { useOptions, useReservationUnitList } from "@/hooks";
import { getCommonServerSideProps } from "@/modules/serverUtils";
import {
  ApplicationFunnelWrapper,
  Page1 as Page1Impl,
} from "@/components/application";
import {
  type ApplicationPage1FormValues,
  ApplicationPage1SchemaRefined,
  transformApplicationPage1,
  convertApplicationPage1,
} from "@/components/application/form";

function Page1({
  application,
  unitsAll,
}: Pick<PropsNarrowed, "application" | "unitsAll">): JSX.Element {
  const router = useRouter();
  const { i18n } = useTranslation();
  const dislayError = useDisplayError();
  const [mutate] = useUpdateApplicationMutation();

  const saveAndNavigate = async (values: ApplicationPage1FormValues) => {
    try {
      const input = transformApplicationPage1(values);
      const { data } = await mutate({ variables: { input } });
      const { pk } = data?.updateApplication ?? {};
      if (pk == null) {
        throw new Error("Failed to save application");
      }
      router.push(getApplicationPath(pk, "page2"));
    } catch (err) {
      dislayError(err);
    }
  };

  const lang = convertLanguageCode(i18n.language);
  const { applicationRound } = application;
  const resUnitPks = applicationRound.reservationUnits?.map(
    (resUnit) => resUnit.unit?.pk
  );
  const unitsInApplicationRound = filterNonNullable(uniq(resUnitPks));
  const unitOptions = unitsAll
    .filter((u) => u.pk != null && unitsInApplicationRound.includes(u.pk))
    .map((u) => ({
      value: u.pk ?? 0,
      label: getTranslationSafe(u, "name", lang),
    }));
  const { options } = useOptions();

  const { getReservationUnits } = useReservationUnitList(applicationRound);

  const begin = new Date(applicationRound.reservationPeriodBegin);
  const end = new Date(applicationRound.reservationPeriodEnd);
  const form = useForm<ApplicationPage1FormValues>({
    mode: "onChange",
    defaultValues: convertApplicationPage1(application, getReservationUnits()),
    resolver: zodResolver(ApplicationPage1SchemaRefined({ begin, end })),
  });

  const { handleSubmit } = form;

  const onSubmit = (values: ApplicationPage1FormValues) => {
    saveAndNavigate(values);
  };

  return (
    <FormProvider {...form}>
      <Flex as="form" noValidate onSubmit={handleSubmit(onSubmit)}>
        <ApplicationFunnelWrapper page="page1" application={application}>
          <Page1Impl
            applicationRound={applicationRound}
            options={{ ...options, unitOptions }}
          />
        </ApplicationFunnelWrapper>
      </Flex>
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
    ApplicationPage1Query,
    ApplicationPage1QueryVariables
  >({
    query: ApplicationPage1Document,
    variables: {
      id: base64encode(`ApplicationNode:${pk}`),
      orderUnitsBy: [UnitOrderingChoices.RankAsc],
    },
  });
  const { application } = data;
  if (application == null) {
    return notFound;
  }
  const unitsAll = filterNonNullable(data.unitsAll);

  return {
    props: {
      ...commonProps,
      application,
      unitsAll,
      ...(await serverSideTranslations(locale ?? "fi")),
    },
  };
}

export default Page1;

export const APPLICATION_PAGE1_QUERY = gql`
  query ApplicationPage1($id: ID!, $orderUnitsBy: [UnitOrderingChoices]) {
    application(id: $id) {
      ...ApplicationForm
    }
    unitsAll(
      publishedReservationUnits: true
      onlySeasonalBookable: true
      orderBy: $orderUnitsBy
    ) {
      id
      pk
      nameFi
      nameEn
      nameSv
    }
  }
`;
