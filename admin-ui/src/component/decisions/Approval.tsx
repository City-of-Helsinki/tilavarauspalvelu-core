import React from "react";
import { useParams } from "react-router-dom";
import SupervisorApproval from "./SupervisorApproval";

interface IProps {
  applicationRoundId: string;
}

function Approval(): JSX.Element | null {
  const { applicationRoundId } = useParams<IProps>();

  return <SupervisorApproval applicationRoundId={applicationRoundId} />;
}

export default Approval;
