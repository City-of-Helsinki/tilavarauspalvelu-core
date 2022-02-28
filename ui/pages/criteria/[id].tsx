import React from "react";
import { useTranslation } from "react-i18next";
import { GetServerSideProps } from "next";
import styled from "styled-components";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import Container from "../../components/common/Container";
import { getApplicationRound } from "../../modules/api";
import { ApplicationRound } from "../../modules/types";
import Sanitize from "../../components/common/Sanitize";
import Breadcrumb from "../../components/common/Breadcrumb";
import KorosDefault from "../../components/common/KorosDefault";

type Props = {
  applicationRound: ApplicationRound;
};

export const getServerSideProps: GetServerSideProps = async ({
  locale,
  params,
}) => {
  const id = Number(params.id);
  const applicationRound = await getApplicationRound({ id });

  return {
    props: {
      applicationRound,
      ...(await serverSideTranslations(locale)),
    },
  };
};

const Head = styled.div`
  background-color: var(--tilavaraus-hero-background-color);
  color: var(--color-white);
`;

const HeadContent = styled.div`
  padding: var(--spacing-l) var(--spacing-m) var(--spacing-l);
  max-width: var(--container-width-xl);
  margin: 0 auto var(--spacing-2-xl) auto;
  font-size: var(--fontsize-body-xl);
`;

const H1 = styled.h1`
  font-size: var(--fontsize-heading-l);
`;

const Content = styled.div`
  max-width: var(--container-width-l);
  font-family: var(--font-regular);
  font-size: var(--fontsize-body-l);
`;

const Criteria = ({ applicationRound }: Props): JSX.Element => {
  const { t } = useTranslation();

  return (
    <>
      <Head>
        <HeadContent>
          <Breadcrumb current={{ label: "criteria" }} />
          <H1>
            {`${applicationRound?.name} ${t("applicationRound:criteria")}`}
          </H1>
        </HeadContent>
        <KorosDefault
          from="var(--tilavaraus-hero-background-color)"
          to="var(--tilavaraus-gray)"
        />
      </Head>
      <Container>
        <Content>
          <Sanitize html={applicationRound?.criteria || ""} />
        </Content>
      </Container>
    </>
  );
};

export default Criteria;
