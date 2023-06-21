import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AxiosError } from "axios";
import Review from "./review/Review";
import Allocation from "./Allocation";
import Handling from "./Handling";
import PreApproval from "./PreApproval";
import {
  ApplicationRoundStatus,
  ApplicationRound as ApplicationRoundType,
} from "../../common/types";
import {
  getApplicationRound,
  patchApplicationRoundStatus,
} from "../../common/api";
import Loader from "../Loader";
import { useNotification } from "../../context/NotificationContext";

type IProps = {
  applicationRoundId: string;
};

function ApplicationRound(): JSX.Element | null {
  const [isLoading, setIsLoading] = useState(true);
  const { notifyError } = useNotification();
  const [applicationRound, setApplicationRound] =
    useState<ApplicationRoundType | null>(null);

  const { applicationRoundId } = useParams<IProps>();
  const { t } = useTranslation();

  const setApplicationRoundStatus = async (
    id: number,
    status: ApplicationRoundStatus
  ) => {
    try {
      const result = await patchApplicationRoundStatus(id, status);
      setApplicationRound(result);
    } catch (error) {
      notifyError(t("errors.errorSavingData"));
    }
  };

  useEffect(() => {
    const fetchApplicationRound = async () => {
      setIsLoading(true);

      try {
        const result = await getApplicationRound({
          id: Number(applicationRoundId),
        });
        setApplicationRound(result);
      } catch (error) {
        const msg =
          (error as AxiosError).response?.status === 404
            ? "errors.applicationRoundNotFound"
            : "errors.errorFetchingData";
        notifyError(t(msg));
      } finally {
        setIsLoading(false);
      }
    };

    fetchApplicationRound();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applicationRoundId]);

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
          setApplicationRound={setApplicationRound}
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

export default ApplicationRound;
