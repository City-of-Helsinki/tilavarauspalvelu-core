import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { type AxiosError } from "axios";
import Review from "./review/Review";
import { getApplicationRound } from "../../common/api";
import Loader from "../Loader";
import { useNotification } from "../../context/NotificationContext";

type IParams = {
  applicationRoundId: string;
};

function ApplicationRound({
  applicationRoundId,
}: {
  applicationRoundId: number;
}): JSX.Element | null {
  const { notifyError } = useNotification();
  const { t } = useTranslation();

  // TODO converting this to graphql requires translating the State type
  const { data: applicationRound, isLoading } = useQuery({
    queryKey: ["applicationRound", applicationRoundId],
    queryFn: () => getApplicationRound({ id: Number(applicationRoundId) }),
    onError: (error: AxiosError) => {
      const msg =
        (error as AxiosError).response?.status === 404
          ? "errors.applicationRoundNotFound"
          : "errors.errorFetchingData";
      notifyError(t(msg));
    },
  });

  if (isLoading) {
    return <Loader />;
  }

  switch (applicationRound?.status) {
    case "allocated":
    case "approved":
    case "handled":
    case "validated":
    case "draft":
    case "in_review":
      return <Review applicationRound={applicationRound} />;

    default:
      return (
        <div>
          {t("errors.applicationRoundStatusNotSupported", {
            status: applicationRound?.status,
          })}
        </div>
      );
  }
}

function ApplicationRoundRouted(): JSX.Element | null {
  const { t } = useTranslation();
  const { applicationRoundId } = useParams<IParams>();

  if (!applicationRoundId || Number.isNaN(Number(applicationRoundId))) {
    return <div>{t("errors.router.invalidApplicationRoundNumber")}</div>;
  }
  return <ApplicationRound applicationRoundId={Number(applicationRoundId)} />;
}

export default ApplicationRoundRouted;
