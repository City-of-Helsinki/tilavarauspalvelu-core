import React, { ReactNode, useEffect, useState } from "react";
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
import {
  getApplicationRound,
  patchApplicationRoundStatus,
} from "../../common/api";
import Loader from "../Loader";

interface IProps {
  applicationRoundId: string;
}

function ApplicationRound(): JSX.Element | null {
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
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

  if (isLoading) {
    return <Loader />;
  }

  let content: ReactNode;

  if (applicationRound?.status === "review_done") {
    content = (
      <Allocation
        applicationRound={applicationRound}
        setApplicationRoundStatus={(status: ApplicationRoundStatus) =>
          setApplicationRoundStatus(Number(applicationRoundId), status)
        }
      />
    );
  } else if (applicationRound?.status === "allocated") {
    content = (
      <Handling
        applicationRound={applicationRound}
        setApplicationRound={setApplicationRound}
        setApplicationRoundStatus={(status: ApplicationRoundStatus) =>
          setApplicationRoundStatus(Number(applicationRoundId), status)
        }
      />
    );
  } else if (
    applicationRound &&
    ["handled", "validated"].includes(applicationRound.status)
  ) {
    content = (
      <PreApproval
        applicationRound={applicationRound}
        setApplicationRoundStatus={(status: ApplicationRoundStatus) =>
          setApplicationRoundStatus(Number(applicationRoundId), status)
        }
      />
    );
  } else if (applicationRound?.status === "approved") {
    content = (
      <Handling
        applicationRound={applicationRound}
        setApplicationRound={setApplicationRound}
        setApplicationRoundStatus={(status: ApplicationRoundStatus) =>
          setApplicationRoundStatus(Number(applicationRoundId), status)
        }
      />
    );
  } else if (
    applicationRound &&
    ["draft", "in_review"].includes(applicationRound.status)
  ) {
    content = (
      <Review
        applicationRound={applicationRound}
        setApplicationRoundStatus={(status: ApplicationRoundStatus) =>
          setApplicationRoundStatus(Number(applicationRoundId), status)
        }
      />
    );
  }

  return (
    <>
      {content}
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
