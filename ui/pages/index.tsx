import React from "react";
import { useTranslation } from "next-i18next";
import styled from "styled-components";
import { GetServerSideProps } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
// import { gql } from "@apollo/client";
// import apolloClient from "../modules/apolloClient";
import Header from "../components/index/Header";
// import Shortcuts from "../components/index/Shortcuts";
// import Recommendations from "../components/index/Recommendations";
import SearchGuides from "../components/index/SearchGuides";
import ServiceInfo from "../components/index/ServiceInfo";
import { breakpoint, StyledKoros } from "../modules/style";
// import Promotions from "../components/index/Promotions";
import { Promotion } from "../modules/types";
import { ReservationUnitType } from "../modules/gql-types";

type Props = {
  promotions: Promotion[];
  recommendations: ReservationUnitType[];
};

export const getServerSideProps: GetServerSideProps = async ({ locale }) => {
  // const PROMOTIONS = gql`
  //   query Promotions {
  //     promotions {
  //       id
  //       heading
  //       image
  //       link
  //     }
  //   }
  // `;

  // const RECOMMENDATIONS = gql`
  //   query Recommendations {
  //     recommendations {
  //       id
  //       name
  //       images {
  //         imageUrl
  //         mediumUrl
  //         smallUrl
  //         imageType
  //       }
  //       building {
  //         id
  //         name
  //       }
  //       reservationUnitType {
  //         name
  //       }
  //       maxPersons
  //       location {
  //         addressStreet
  //       }
  //     }
  //   }
  // `;

  try {
    // const { data: promotionsData } = await apolloClient.query({
    //   query: PROMOTIONS,
    //   errorPolicy: "ignore",
    // });

    // const { data: recommendationsData } = await apolloClient.query({
    //   query: RECOMMENDATIONS,
    //   errorPolicy: "ignore",
    // });

    return {
      props: {
        // promotions: promotionsData.promotions
        //   ? promotionsData.promotions.slice(0, 6)
        //   : [],
        // recommendations: recommendationsData.recommendations,
        ...(await serverSideTranslations(locale)),
      },
    };
  } catch (e) {
    return {
      props: {
        promotions: [],
        recommendations: [],
        ...(await serverSideTranslations(locale)),
      },
    };
  }
};

const DesktopStyledKoros = styled(StyledKoros)`
  display: none;
  margin-top: -54px;

  @media (min-width: ${breakpoint.m}) {
    display: block;
  }
`;

const MobileStyledKoros = styled(StyledKoros)`
  @media (min-width: ${breakpoint.m}) {
    display: none;
  }
`;

const Home = ({ promotions, recommendations }: Props): JSX.Element => {
  const { t } = useTranslation("home");

  const shouldDisplayRecommendations = recommendations?.length > 0;
  const shouldDisplayPromotions = promotions?.length >= 2;

  return (
    <>
      <Header heading={t("head.heading")} text={t("head.text")} />
      <DesktopStyledKoros
        $from="transparent"
        // $to="var(--tilavaraus-header-background-color)"
        $to="var(--tilavaraus-gray)"
        type="wave"
      />
      {/* <Shortcuts /> */}
      <MobileStyledKoros
        $from="var(--tilavaraus-header-background-color)"
        // $from="var(--tilavaraus-gray)"
        $to={
          !shouldDisplayRecommendations && shouldDisplayPromotions
            ? "var(--color-white)"
            : "var(--tilavaraus-gray)"
        }
        type="wave"
      />
      {/* {shouldDisplayRecommendations && (
        <Recommendations recommendations={recommendations} />
      )} */}
      {/* {shouldDisplayPromotions && (
        <>
          {shouldDisplayRecommendations && (
            <StyledKoros
              $from="var(--tilavaraus-gray)"
              $to="var(--color-white)"
              type="basic"
            />
          )}
          <Promotions items={promotions} />
          <StyledKoros
            $from="var(--color-white)"
            $to="var(--tilavaraus-gray)"
            type="basic"
          />
        </>
      )} */}
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
