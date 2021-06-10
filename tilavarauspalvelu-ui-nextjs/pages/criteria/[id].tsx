import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Koros } from "hds-react";
import { GetServerSideProps } from "next";
import styled from "styled-components";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useRouter } from "next/router";
import Container from "../../components/common/Container";
import { getApplicationRound } from "../../modules/api";
import { CenterSpinner } from "../../components/common/common";
import { ApplicationRound } from "../../modules/types";
import Sanitize from "../../components/common/Sanitize";

export const getServerSideProps: GetServerSideProps = async ({ locale }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale)),
    },
  };
};

const Head = styled.div`
  background-color: var(--color-white);
`;

const HeadContent = styled.div`
  padding: var(--spacing-l) var(--spacing-m) 0;
  max-width: var(--container-width-xl);
  margin: 0 auto var(--spacing-2-xl) auto;
  font-size: var(--fontsize-body-xl);
`;

const H1 = styled.h1`
  font-size: var(--fontsize-heading-l);
`;

const StyledKoros = styled(Koros)`
  fill: var(--tilavaraus-gray);
`;

const Content = styled.div`
  max-width: var(--container-width-l);
  font-family: var(--font-regular);
  font-size: var(--fontsize-body-l);
`;

const Criteria = (): JSX.Element => {
  const { t } = useTranslation();

  const router = useRouter();
  const { id } = router.query;

  const [applicationRound, setApplicationRound] = useState<ApplicationRound>();
  const [state, setState] = useState<"loading" | "done" | "error">("loading");

  useEffect(() => {
    async function fetchData() {
      try {
        const round = await getApplicationRound({
          id: Number(id),
        });
        setApplicationRound(round);
        setState("done");
      } catch (e) {
        setState("error");
      }
    }
    fetchData();
  }, [id]);

  return state !== "loading" ? (
    <>
      <Head>
        <HeadContent>
          <H1>
            {state === "done"
              ? `${applicationRound?.name} ${t("applicationRound:criteria")}`
              : t("common:error.dataError")}
          </H1>
        </HeadContent>
        <StyledKoros className="koros" type="wave" />
      </Head>
      <Container>
        <Content>
          <Sanitize html={applicationRound?.criteria || ""} />
        </Content>
      </Container>
    </>
  ) : (
    <CenterSpinner />
  );
};

export default Criteria;
