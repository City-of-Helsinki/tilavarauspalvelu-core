import React from "react";
import { useLocation, useParams } from "react-router-dom";
import Allocation from "./Allocation";
import Review from "./Review";

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

  return <Review applicationRoundId={applicationRoundId} />;
}

export default ApplicationRound;
