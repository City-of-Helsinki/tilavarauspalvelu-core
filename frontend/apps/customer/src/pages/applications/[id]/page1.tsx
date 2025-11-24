import React from "react";
import { FormProvider, useForm } from "react-hook-form";
import { gql } from "@apollo/client";
import { zodResolver } from "@hookform/resolvers/zod";
import { uniq } from "lodash-es";
import type { GetServerSidePropsContext } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useRouter } from "next/router";
import { useDisplayError } from "ui/src/hooks";
import { createNodeId, filterNonNullable, ignoreMaybeArray, toNumber } from "ui/src/modules/helpers";
import { Flex } from "ui/src/styled";
import { ApplicationFunnelWrapper, Page1 as Page1Impl } from "@/components/application/funnel";
import {
  ApplicationPage1SchemaRefined,
  transformApplicationPage1,
  convertApplicationPage1,
} from "@/components/application/funnel/form";
import type { ApplicationPage1FormValues } from "@/components/application/funnel/form";
import { useReservationUnitList } from "@/hooks";
import { createApolloClient } from "@/modules/apolloClient";
import { getSearchOptions } from "@/modules/search";
import { getCommonServerSideProps } from "@/modules/serverUtils";
import { getApplicationPath } from "@/modules/urls";
import { ApplicationPage1Document, useUpdateApplicationMutation } from "@gql/gql-types";
import type { ApplicationPage1Query, ApplicationPage1QueryVariables } from "@gql/gql-types";

function Page1({ application, options: optionsOrig }: Pick<PropsNarrowed, "application" | "options">): JSX.Element {
  const router = useRouter();
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

  const { applicationRound } = application;
  const resUnitPks = applicationRound.reservationUnits?.map((resUnit) => resUnit.unit?.pk);
  const unitsInApplicationRound = filterNonNullable(uniq(resUnitPks));

  const options = {
    ...optionsOrig,
    units: optionsOrig.units.filter((u) => unitsInApplicationRound.includes(u.value)),
  };
  const { getReservationUnits } = useReservationUnitList(applicationRound);

  const begin = new Date(applicationRound.reservationPeriodBeginDate);
  const end = new Date(applicationRound.reservationPeriodEndDate);
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
          <Page1Impl applicationRound={applicationRound} options={options} />
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

  const notFound = {
    props: {
      notFound: true,
      ...(await serverSideTranslations(locale ?? "fi")),
    },
    notFound: true,
  };
  if (pk == null) {
    return notFound;
  }

  const { apiBaseUrl } = getCommonServerSideProps();
  const client = createApolloClient(apiBaseUrl, ctx);
  const { data } = await client.query<ApplicationPage1Query, ApplicationPage1QueryVariables>({
    query: ApplicationPage1Document,
    variables: {
      id: createNodeId("ApplicationNode", pk),
    },
  });
  const { application } = data;
  if (application == null) {
    return notFound;
  }

  const options = await getSearchOptions(client, "seasonal", locale ?? "fi");

  return {
    props: {
      application,
      options,
      ...(await serverSideTranslations(locale ?? "fi")),
    },
  };
}

export default Page1;

export const APPLICATION_PAGE1_QUERY = gql`
  query ApplicationPage1($id: ID!) {
    application(id: $id) {
      ...ApplicationForm
    }
  }
`;
