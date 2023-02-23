import { Notification, Select } from "hds-react";
import React, { useState } from "react";
import { useTranslation } from "next-i18next";
import { useRouter } from "next/router";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useQuery } from "@apollo/client";
import { GetStaticProps } from "next";
import styled from "styled-components";
import { Application, OptionType } from "common/types/common";
import { breakpoints } from "common/src/common/style";
import { Query, QueryApplicationRoundsArgs } from "common/types/gql-types";
import { saveApplication } from "../modules/api";
import { applicationRoundState, deepCopy } from "../modules/util";
import { minimalApplicationForInitialSave } from "../modules/application/applicationInitializer";
import { MediumButton } from "../styles/util";
import Head from "../components/application/Head";
import { APPLICATION_ROUNDS } from "../modules/queries/applicationRound";
import { CenterSpinner } from "../components/common/common";
import { getApplicationRoundName } from "../modules/applicationRound";

export const getStaticProps: GetStaticProps = async ({ locale }) => {
  return {
    props: {
      overrideBackgroundColor: "white",
      ...(await serverSideTranslations(locale)),
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

  #applicationRoundSelect-label {
    display: none;
  }

  @media (max-width: ${breakpoints.l}) {
    grid-template-columns: 1fr;
  }
`;

const IntroPage = (): JSX.Element => {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);
  const [applicationRounds, setApplicationRounds] = useState<OptionType[]>([]);
  const [applicationRound, setApplicationRound] = useState(0);

  const history = useRouter();
  const { t } = useTranslation();

  useQuery<Query, QueryApplicationRoundsArgs>(APPLICATION_ROUNDS, {
    fetchPolicy: "no-cache",
    onCompleted: (data) => {
      const now = new Date();
      const ars = data?.applicationRounds?.edges
        ?.map((n) => n.node)
        .filter(
          (ar) =>
            new Date(ar.publicDisplayBegin) <= now &&
            new Date(ar.publicDisplayEnd) >= now &&
            applicationRoundState(
              ar.applicationPeriodBegin,
              ar.applicationPeriodEnd
            ) === "active"
        )
        .map((ar) => ({
          value: ar.pk,
          label: getApplicationRoundName(ar),
        }));
      setApplicationRounds(ars);
    },
  });

  const createNewApplication = async (applicationRoundId: number) => {
    setSaving(true);

    try {
      const templateApplication = {
        ...deepCopy(minimalApplicationForInitialSave(applicationRoundId)),
      } as Application;

      const savedApplication = await saveApplication(templateApplication);
      if (savedApplication.id) {
        history.replace(`/application/${savedApplication.id}/page1`);
      }
    } catch (e) {
      setError(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Head noKoros heading={t("application:Intro.heading")}>
        <Container>
          {applicationRounds.length > 0 ? (
            <>
              <Select
                id="applicationRoundSelect"
                placeholder={t("common:select")}
                options={applicationRounds as OptionType[]}
                label={t("common:select")}
                onChange={(selection: OptionType): void => {
                  setApplicationRound(selection.value as number);
                }}
                value={applicationRounds?.find(
                  (n) => n.value === applicationRound
                )}
              />
              <MediumButton
                id="start-application"
                disabled={!applicationRound || saving}
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
      {error ? (
        <Notification
          type="error"
          label={t("application:Intro.createFailedHeading")}
          position="top-center"
          autoClose
          displayAutoCloseProgress={false}
          onClose={() => setError(false)}
        >
          {t("application:Intro.createFailedContent")}
          {error}
        </Notification>
      ) : null}
    </>
  );
};

export default IntroPage;
