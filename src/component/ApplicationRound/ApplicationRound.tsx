import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Notification } from "hds-react";
import Review from "./Review";
import Allocation from "./Allocation";
import Handling from "./Handling";
import PreApproval from "./PreApproval";
import {
  ApplicationRoundStatus,
  ApplicationRound as ApplicationRoundType,
} from "../../common/types";
import { getApplicationRound, saveApplicationRound } from "../../common/api";
import Loader from "../Loader";

interface IProps {
  applicationRoundId: string;
}

function ApplicationRound(): JSX.Element | null {
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [
    applicationRound,
    setApplicationRound,
  ] = useState<ApplicationRoundType | null>(null);

  const { applicationRoundId } = useParams<IProps>();
  const { t } = useTranslation();

  const setApplicationRoundStatus = async (status: ApplicationRoundStatus) => {
    const payload = { ...applicationRound, status } as ApplicationRoundType;

    try {
      const result = await saveApplicationRound(payload);
      setApplicationRound(result);
    } catch (error) {
      setErrorMsg("errors.errorSavingData");
    }
  };

  useEffect(() => {
    const fetchApplicationRound = async () => {
      setErrorMsg(null);
      setIsLoading(true);

      try {
        const result = await getApplicationRound({
          id: Number(applicationRoundId),
        });
        setApplicationRound(result);
        setIsLoading(false);
      } catch (error) {
        const msg =
          error.response?.status === 404
            ? "errors.applicationRoundNotFound"
            : "errors.errorFetchingData";
        setErrorMsg(msg);
        setIsLoading(false);
      }
    };

    fetchApplicationRound();
  }, [applicationRoundId]);

  if (isLoading || !applicationRound) {
    return <Loader />;
  }

  if (applicationRound.status === "review_done") {
    return (
      <Allocation
        applicationRound={applicationRound}
        setApplicationRoundStatus={setApplicationRoundStatus}
      />
    );
  }

  if (applicationRound.status === "allocated") {
    return (
      <Handling
        applicationRound={applicationRound}
        setApplicationRound={setApplicationRound}
        setApplicationRoundStatus={setApplicationRoundStatus}
      />
    );
  }

  if (["handled", "validated"].includes(applicationRound.status)) {
    return (
      <PreApproval
        applicationRound={applicationRound}
        setApplicationRoundStatus={setApplicationRoundStatus}
      />
    );
  }

  return (
    <>
      <Review
        applicationRound={applicationRound}
        setApplicationRoundStatus={setApplicationRoundStatus}
      />
      {errorMsg && (
        <Notification
          type="error"
          label={t("errors.functionFailed")}
          position="top-center"
          autoClose={false}
          dismissible
          closeButtonLabelText={t("common.close")}
          displayAutoCloseProgress={false}
          onClose={() => setErrorMsg(null)}
        >
          {t(errorMsg)}
        </Notification>
      )}
    </>
  );
}

export default ApplicationRound;
