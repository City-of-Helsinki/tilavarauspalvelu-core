import { Notification, Select } from "hds-react";
import React, { useState } from "react";
import { useTranslation } from "next-i18next";
import { useRouter } from "next/router";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import type { GetServerSidePropsContext } from "next";
import styled from "styled-components";
import { breakpoints } from "common/src/common/style";
import { filterNonNullable } from "common/src/helpers";
import {
  ApplicationRoundStatusChoice,
  type ApplicationCreateMutationInput,
  type Query,
  type QueryApplicationRoundsArgs,
  useCreateApplicationMutation,
} from "@gql/gql-types";
import { MediumButton } from "@/styles/util";
import Head from "@/components/application/Head";
import { APPLICATION_ROUNDS } from "@/modules/queries/applicationRound";
import { CenterSpinner } from "@/components/common/common";
import { getApplicationRoundName } from "@/modules/applicationRound";
import { getCommonServerSideProps } from "@/modules/serverUtils";
import { createApolloClient } from "@/modules/apolloClient";

type Props = Awaited<ReturnType<typeof getServerSideProps>>["props"];

export const getServerSideProps = async (ctx: GetServerSidePropsContext) => {
  const { locale } = ctx;
  const commonProps = getCommonServerSideProps();
  const apolloClient = createApolloClient(commonProps.apiBaseUrl, ctx);

  const { data } = await apolloClient.query<Query, QueryApplicationRoundsArgs>({
    query: APPLICATION_ROUNDS,
    fetchPolicy: "no-cache",
  });

  const applicationRounds = filterNonNullable(
    data?.applicationRounds?.edges?.map((n) => n?.node)
  );

  return {
    props: {
      ...commonProps,
      ...(await serverSideTranslations(locale ?? "fi")),
      applicationRounds,
    },
  };
};

const Container = styled.div`
  margin-top: var(--spacing-layout-m);
  padding-bottom: var(--spacing-layout-xl);
  font-size: var(--fontsize-body-m);
  gap: var(--spacing-l);
  display: grid;
  grid-template-columns: 1fr 382px;

  /* stylelint-disable-next-line */
  #applicationRoundSelect-label {
    display: none;
  }

  @media (max-width: ${breakpoints.l}) {
    grid-template-columns: 1fr;
  }
`;

const IntroPage = ({ applicationRounds }: Props): JSX.Element => {
  const history = useRouter();
  const { t } = useTranslation();

  const [error, setError] = useState<string | undefined>(undefined);
  const [applicationRound, setApplicationRound] = useState(0);

  const applicationRoundOptions =
    applicationRounds
      .filter((ar) => ar.status === ApplicationRoundStatusChoice.Open)
      .map((ar) => ({
        value: ar.pk ?? 0,
        label: getApplicationRoundName(ar),
      })) ?? [];

  const [create, { loading: isSaving }] = useCreateApplicationMutation({
    onError: (e) => {
      // eslint-disable-next-line no-console
      console.warn("create application mutation failed: ", e);
      setError(t("application:Intro.createFailedContent"));
    },
  });

  const createNewApplication = async (applicationRoundId: number) => {
    const input: ApplicationCreateMutationInput = {
      applicationRound: applicationRoundId,
    };
    const { data: mutResponse, errors } = await create({
      variables: { input },
    });

    if (errors) {
      // eslint-disable-next-line no-console
      console.error("create application mutation failed: ", errors);
    } else if (mutResponse?.createApplication?.pk) {
      const { pk } = mutResponse.createApplication;
      history.replace(`/application/${pk}/page1`);
    } else {
      // eslint-disable-next-line no-console
      console.error(
        "create application mutation failed: ",
        mutResponse?.createApplication
      );
    }
  };

  return (
    <>
      <Head noKoros heading={t("application:Intro.heading")}>
        <Container>
          {applicationRounds.length > 0 ? (
            <>
              <Select<{ value: number; label: string }>
                id="applicationRoundSelect"
                placeholder={t("common:select")}
                options={applicationRoundOptions}
                label={t("common:select")}
                onChange={(selection: { value: number; label: string }) => {
                  setApplicationRound(selection.value);
                }}
                value={
                  applicationRoundOptions.find(
                    (n) => n.value === applicationRound
                  ) ?? null
                }
              />
              <MediumButton
                id="start-application"
                disabled={!applicationRound || isSaving}
                onClick={() => {
                  createNewApplication(applicationRound);
                }}
              >
                {t("application:Intro.startNewApplication")}
              </MediumButton>
            </>
          ) : (
            <CenterSpinner />
          )}
        </Container>
      </Head>
      {error != null ? (
        <Notification
          type="error"
          label={t("application:Intro.createFailedHeading")}
          position="top-center"
          autoClose
          displayAutoCloseProgress={false}
          onClose={() => setError(undefined)}
        >
          {error}
        </Notification>
      ) : null}
    </>
  );
};

export default IntroPage;
