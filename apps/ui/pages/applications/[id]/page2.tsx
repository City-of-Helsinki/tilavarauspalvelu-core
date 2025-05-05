import React, { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";
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
import { getCommonServerSideProps } from "@/modules/serverUtils";
import { base64encode, ignoreMaybeArray, toNumber } from "common/src/helpers";
import { createApolloClient } from "@/modules/apolloClient";
import {
  ApplicationPage2Document,
  useUpdateApplicationMutation,
  type ApplicationPage2Query,
  type ApplicationPage2QueryVariables,
} from "@/gql/gql-types";
import { getApplicationPath } from "@/modules/urls";
import { useDisplayError } from "common/src/hooks";
import { gql } from "@apollo/client";

function Page2({ application }: PropsNarrowed): JSX.Element {
  const router = useRouter();
  const [mutate] = useUpdateApplicationMutation();
  const dislayError = useDisplayError();

  const saveAndNavigate = async (values: ApplicationPage2FormValues) => {
    try {
      const isInvalidPk = values.applicationSections.some(
        (section) => typeof section.pk !== "number"
      );
      if (isInvalidPk) {
        const context = {
          level: "error" as const,
          extra: {
            formValues: values,
          },
        };
        Sentry.captureMessage(
          "Invalid type in section pk (not number) in application form",
          context
        );
      }
      const input = transformApplicationPage2(values);
      const { data } = await mutate({ variables: { input } });
      const { pk } = data?.updateApplication ?? {};
      if (pk == null) {
        throw new Error("Failed to save application");
      }
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

  useEffect(() => {
    const isInvalidPk = (application.applicationSections ?? []).some(
      (section) => typeof section.pk !== "number"
    );
    if (isInvalidPk) {
      const context = {
        level: "error" as const,
        extra: {
          application,
        },
      };
      Sentry.captureMessage(
        "Invalid type in section pk (not number) in application gql query",
        context
      );
    }
  }, [application]);

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
      applicationSections {
        id
        reservationUnitOptions {
          id
          reservationUnit {
            id
            pk
            nameTranslations {
              fi
              en
              sv
            }
            unit {
              id
              nameTranslations {
                fi
                en
                sv
              }
            }
            applicationRoundTimeSlots {
              ...TimeSelector
            }
          }
        }
      }
    }
  }
`;
