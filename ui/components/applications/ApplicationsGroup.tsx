import React from "react";
import styled from "styled-components";
import { Application, ApplicationRound } from "../../modules/types";
import ApplicationCard from "./ApplicationCard";

const GroupName = styled.h2`
  font-size: var(--fontsize-heading-m);
`;

type Props = {
  name: string;
  rounds: { [key: number]: ApplicationRound };
  applications: Application[];
};

const ApplicationsGroup = ({
  name,
  applications,
  rounds,
}: Props): JSX.Element | null => {
  if (!applications.length) {
    return null;
  }

  return (
    <>
      <GroupName>{name}</GroupName>
      {applications.map((application) => (
        <ApplicationCard
          key={application.id}
          application={application}
          applicationRound={rounds[application.applicationRoundId]}
        />
      ))}
    </>
  );
};

export default ApplicationsGroup;
