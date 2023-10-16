import React from "react";
import { useQuery, gql } from "@apollo/client";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { type Query } from "common/types/gql-types";
import { useNotification } from "@/context/NotificationContext";
import BreadcrumbWrapper from "@/component/BreadcrumbWrapper";
import { publicUrl } from "@/common/const";
import Loader from "@/component/Loader";
import Review from "./review/Review";

// TODO pick the fields we need
const APPLICATION_ROUD_QUERY = gql`
  query ApplicationRoundCriteria($pk: [ID]!) {
    applicationRounds(pk: $pk) {
      edges {
        node {
          pk
          nameFi
          status
          applicationPeriodBegin
          applicationPeriodEnd
          reservationUnits {
            pk
          }
        }
      }
    }
  }
`;

function ApplicationRound({
  applicationRoundId,
}: {
  applicationRoundId: number;
}): JSX.Element | null {
  const { notifyError } = useNotification();
  const { t } = useTranslation();

  const { data, loading: isLoading } = useQuery<Query>(APPLICATION_ROUD_QUERY, {
    skip: !applicationRoundId,
    variables: {
      pk: [applicationRoundId],
    },
    onError: () => {
      notifyError(t("errors.errorFetchingData"));
    },
  });
  const applicationRound = data?.applicationRounds?.edges?.[0]?.node;

  if (isLoading) {
    return <Loader />;
  }

  if (!applicationRound) {
    return <div>{t("errors.applicationRoundNotFound")}</div>;
  }

  return (
    <>
      <BreadcrumbWrapper
        route={[
          "recurring-reservations",
          `${publicUrl}/recurring-reservations/application-rounds`,
          "application-round",
        ]}
        aliases={[
          { slug: "application-round", title: applicationRound.nameFi ?? "-" },
        ]}
      />
      <Review applicationRound={applicationRound} />;
    </>
  );
}

type IParams = {
  applicationRoundId: string;
};

function ApplicationRoundRouted(): JSX.Element | null {
  const { t } = useTranslation();
  const { applicationRoundId } = useParams<IParams>();

  if (!applicationRoundId || Number.isNaN(Number(applicationRoundId))) {
    return <div>{t("errors.router.invalidApplicationRoundNumber")}</div>;
  }
  return <ApplicationRound applicationRoundId={Number(applicationRoundId)} />;
}

export default ApplicationRoundRouted;
