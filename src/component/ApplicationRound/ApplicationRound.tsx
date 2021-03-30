import React from "react";
import { useLocation, useParams } from "react-router-dom";
import Review from "./Review";
import Allocation from "./Allocation";
import Handling from "./Handling";
import PreApproval from "./PreApproval";
import SupervisorApproval from "./SupervisorApproval";

interface IProps {
  applicationRoundId: string;
}

function ApplicationRound(): JSX.Element {
  const { applicationRoundId } = useParams<IProps>();
  const location = useLocation();

  // TODO: use applicationRound status
  if (location.search === "?reviewed") {
    return <Allocation applicationRoundId={applicationRoundId} />;
  }

  if (location.search === "?allocated") {
    return <Handling applicationRoundId={applicationRoundId} />;
  }

  if (location.search === "?preapproval") {
    return <PreApproval applicationRoundId={applicationRoundId} />;
  }

  if (location.search === "?supervisorapproval") {
    return <SupervisorApproval applicationRoundId={applicationRoundId} />;
  }

  return <Review applicationRoundId={applicationRoundId} />;
}

export default ApplicationRound;
