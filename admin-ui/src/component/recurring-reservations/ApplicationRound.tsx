import React from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { type AxiosError } from "axios";
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

  // TODO converting this to graphql requires translating the State type
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

  const mutation = useMutation({
    mutationFn: ({ status }: { status: ApplicationRoundStatus }) =>
      patchApplicationRoundStatus(applicationRoundId, status),
    onSuccess: () => {
      refetch();
    },
    onError: () => {
      notifyError(t("errors.errorSavingData"));
    },
  });

  if (isLoading) {
    return <Loader />;
  }

  switch (applicationRound?.status) {
    case "review_done":
      return (
        <Allocation
          applicationRound={applicationRound}
          setApplicationRoundStatus={(status) =>
            mutation.mutateAsync({ status })
          }
        />
      );
    case "allocated":
    case "approved":
      return (
        <Handling
          applicationRound={applicationRound}
          setApplicationRoundStatus={(status) =>
            mutation.mutateAsync({ status })
          }
        />
      );
    case "handled":
    case "validated":
      return (
        <PreApproval
          applicationRound={applicationRound}
          setApplicationRoundStatus={(status) =>
            mutation.mutateAsync({ status })
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
