import React from "react";
import { useTranslation } from "next-i18next";
import { GetServerSideProps } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import Header from "../components/index/Header";
import SearchGuides from "../components/index/SearchGuides";
import ServiceInfo from "../components/index/ServiceInfo";
import { StyledKoros } from "../modules/style";
import KorosDefault from "../components/common/KorosDefault";

export const getServerSideProps: GetServerSideProps = async ({ locale }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale)),
    },
  };
};

const Home = (): JSX.Element => {
  const { t } = useTranslation("home");

  return (
    <>
      <Header heading={t("head.heading")} text={t("head.text")} />
      <KorosDefault
        from="var(--tilavaraus-hero-background-color)"
        to="var(--tilavaraus-gray)"
      />
      <SearchGuides />
      <StyledKoros
        $from="var(--tilavaraus-gray)"
        $to="var(--color-white)"
        type="basic"
      />
      <ServiceInfo />
    </>
  );
};

export default Home;
