import React from "react";
import { ApplicationRound } from "../../modules/types";
import ApplicationRoundCard from "./ApplicationRoundCard";

type Props = {
  applicationRounds: ApplicationRound[];
};

const ApplicationPeriodList = ({ applicationRounds }: Props): JSX.Element => {
  if (!applicationRounds) {
    return null;
  }
  return (
    <>
      {applicationRounds.map((p) => (
        <ApplicationRoundCard applicationRound={p} key={`${p.id}${p.name}`} />
      ))}
    </>
  );
};

export default ApplicationPeriodList;
