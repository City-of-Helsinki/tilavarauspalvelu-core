import { Notification, Select } from "hds-react";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useRouter } from "next/router";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { GetStaticProps } from "next";
import styled from "styled-components";
import { getApplicationRounds, saveApplication } from "../modules/api";
import { useApiDataNoParams } from "../hooks/useApiData";
import { breakpoint } from "../modules/style";
import { Application, OptionType } from "../modules/types";
import { applicationRoundState, deepCopy } from "../modules/util";
import Loader from "../components/common/Loader";
import { minimalApplicationForInitialSave } from "../modules/application/applicationInitializer";
import { MediumButton } from "../styles/util";
import RequireAuthentication from "../components/common/RequireAuthentication";
import Head from "../components/application/Head";

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

  @media (max-width: ${breakpoint.l}) {
    grid-template-columns: 1fr;
  }
`;

const Intro = (): JSX.Element => {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);
  const [applicationRound, setApplicationRound] = useState(0);

  const history = useRouter();
  const { t } = useTranslation();

  const applicationRounds = useApiDataNoParams(getApplicationRounds, (rounds) =>
    rounds
      .filter(
        (ar) =>
          applicationRoundState(
            ar.applicationPeriodBegin,
            ar.applicationPeriodEnd
          ) === "active"
      )
      .map((ar) => ({ value: ar.id, label: ar.name }))
  );

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
    <RequireAuthentication>
      <Head noKoros heading={t("application:Intro.heading")} breadCrumbText="">
        <Container>
          <Loader datas={[applicationRounds]}>
            <Select
              id="applicationRoundSelect"
              placeholder={t("common:select")}
              options={applicationRounds.transformed as OptionType[]}
              label=""
              onChange={(selection: OptionType): void => {
                setApplicationRound(selection.value as number);
              }}
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
          </Loader>
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
    </RequireAuthentication>
  );
};

export default Intro;
