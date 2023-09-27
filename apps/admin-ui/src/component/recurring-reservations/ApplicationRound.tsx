import React from "react";
import { useQuery, gql } from "@apollo/client";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { type Query } from "common/types/gql-types";
import Review from "./review/Review";
import Loader from "../Loader";
import { useNotification } from "../../context/NotificationContext";

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

  return <Review applicationRound={applicationRound} />;
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
