import React from "react";
import { useLocation, useParams } from "react-router-dom";
import Review from "./Review";
import Allocation from "./Allocation";
import Handling from "./Handling";
import Approval from "./Approval";

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

  if (location.search === "?approval") {
    return <Approval applicationRoundId={applicationRoundId} />;
  }

  return <Review applicationRoundId={applicationRoundId} />;
}

export default ApplicationRound;
