import React from "react";
import { FormProvider, useForm } from "react-hook-form";
import { useRouter } from "next/router";
import type { GetServerSidePropsContext } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { zodResolver } from "@hookform/resolvers/zod";
import { ApplicationPageWrapper } from "@/components/application/ApplicationPage";
import { Page2 as Page2Impl } from "@/components/application/Page2";
import {
  type ApplicationPage2FormValues,
  transformApplicationPage2,
  convertApplicationPage2,
  ApplicationPage2Schema,
} from "@/components/application/form";
import { useApplicationUpdate } from "@/hooks/useApplicationUpdate";
import { getCommonServerSideProps } from "@/modules/serverUtils";
import { base64encode, ignoreMaybeArray, toNumber } from "common/src/helpers";
import { createApolloClient } from "@/modules/apolloClient";
import {
  ApplicationPage2Document,
  type ApplicationPage2Query,
  type ApplicationPage2QueryVariables,
} from "@/gql/gql-types";
import { getApplicationPath } from "@/modules/urls";
import { useDisplayError } from "@/hooks/useDisplayError";
import { gql } from "@apollo/client";

function Page2({ application }: PropsNarrowed): JSX.Element {
  const router = useRouter();
  const [update] = useApplicationUpdate();
  const dislayError = useDisplayError();

  const saveAndNavigate = async (values: ApplicationPage2FormValues) => {
    try {
      const pk = await update(transformApplicationPage2(values));
      router.push(getApplicationPath(pk, "page3"));
    } catch (err) {
      dislayError(err);
    }
  };

  const form = useForm<ApplicationPage2FormValues>({
    mode: "onChange",
    defaultValues: convertApplicationPage2(application),
    resolver: zodResolver(ApplicationPage2Schema),
  });

  return (
    <FormProvider {...form}>
      <ApplicationPageWrapper
        translationKeyPrefix="application:Page2"
        application={application}
      >
        <Page2Impl application={application} onNext={saveAndNavigate} />
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
    ApplicationPage2Query,
    ApplicationPage2QueryVariables
  >({
    query: ApplicationPage2Document,
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

export default Page2;

export const APPLICATION_PAGE2_QUERY = gql`
  query ApplicationPage2($id: ID!) {
    application(id: $id) {
      ...ApplicationForm
    }
  }
`;
