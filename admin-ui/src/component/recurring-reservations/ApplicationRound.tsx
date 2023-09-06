import React from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { type AxiosError } from "axios";
import { useQuery } from "@tanstack/react-query";
import Review from "./review/Review";
import Allocation from "./Allocation";
import Handling from "./Handling";
import PreApproval from "./PreApproval";
import { ApplicationRoundStatus } from "../../common/types";
import {
  getApplicationRound,
  patchApplicationRoundStatus,
} from "../../common/api";
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

  const {
    data: applicationRound,
    isLoading,
    refetch,
  } = useQuery({
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

  const setApplicationRoundStatus = async (
    id: number,
    status: ApplicationRoundStatus
  ) => {
    try {
      // TODO replace with mutation
      await patchApplicationRoundStatus(id, status);
      refetch();
    } catch (error) {
      notifyError(t("errors.errorSavingData"));
    }
  };

  if (isLoading) {
    return <Loader />;
  }

  switch (applicationRound?.status) {
    case "review_done":
      return (
        <Allocation
          applicationRound={applicationRound}
          setApplicationRoundStatus={(status: ApplicationRoundStatus) =>
            setApplicationRoundStatus(Number(applicationRoundId), status)
          }
        />
      );
    case "allocated":
    case "approved":
      return (
        <Handling
          applicationRound={applicationRound}
          setApplicationRoundStatus={(status: ApplicationRoundStatus) =>
            setApplicationRoundStatus(Number(applicationRoundId), status)
          }
        />
      );
    case "handled":
    case "validated":
      return (
        <PreApproval
          applicationRound={applicationRound}
          setApplicationRoundStatus={(status: ApplicationRoundStatus) =>
            setApplicationRoundStatus(Number(applicationRoundId), status)
          }
        />
      );
    case "draft":
    case "in_review":
      return <Review applicationRound={applicationRound} />;

    default:
      return <> </>;
  }
}

function ApplicationRoundRouted(): JSX.Element | null {
  const { applicationRoundId } = useParams<IParams>();
  if (!applicationRoundId || Number.isNaN(Number(applicationRoundId))) {
    return null;
  }
  return <ApplicationRound applicationRoundId={Number(applicationRoundId)} />;
}

export default ApplicationRoundRouted;
