import React from "react";
import { useQuery } from "@apollo/client";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { type Query } from "common/types/gql-types";
import { useNotification } from "@/context/NotificationContext";
import BreadcrumbWrapper from "@/component/BreadcrumbWrapper";
import Loader from "@/component/Loader";
import { Review } from "./review/Review";
import { APPLICATION_ROUND_QUERY } from "../queries";

function ApplicationRound({
  applicationRoundId,
}: {
  applicationRoundId: number;
}): JSX.Element | null {
  const { notifyError } = useNotification();
  const { t } = useTranslation();

  const { data, loading: isLoading } = useQuery<Query>(
    APPLICATION_ROUND_QUERY,
    {
      skip: !applicationRoundId,
      variables: {
        pk: [applicationRoundId],
      },
      onError: () => {
        notifyError(t("errors.errorFetchingData"));
      },
    }
  );
  const applicationRound = data?.applicationRounds?.edges?.[0]?.node;

  if (isLoading) {
    return <Loader />;
  }

  if (!applicationRound) {
    return <div>{t("errors.applicationRoundNotFound")}</div>;
  }

  const route = [
    {
      alias: t("breadcrumb.recurring-reservations"),
      slug: "",
    },
    {
      alias: t("breadcrumb.application-rounds"),
      slug: `/recurring-reservations/application-rounds`,
    },
    {
      alias: applicationRound.nameFi ?? "-",
      slug: "",
    },
  ];

  return (
    <>
      <BreadcrumbWrapper route={route} />
      <Review applicationRound={applicationRound} />
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
