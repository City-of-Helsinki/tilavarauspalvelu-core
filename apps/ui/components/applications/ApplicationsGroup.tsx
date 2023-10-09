import React from "react";
import styled from "styled-components";
import { H3 } from "common/src/common/typography";
import { ApplicationRoundType, ApplicationType } from "common/types/gql-types";
import ApplicationCard from "./ApplicationCard";

const GroupName = styled(H3).attrs({ as: "h2" })`
  margin-top: 0;
`;

type Props = {
  name: string;
  rounds: { [key: number]: ApplicationRoundType };
  applications: ApplicationType[];
  actionCallback: (string: "error" | "cancel") => Promise<void>;
};

const Wrapper = styled.div`
  margin-bottom: var(--spacing-layout-l);
`;

const ApplicationsGroup = ({
  name,
  applications,
  rounds,
  actionCallback,
}: Props): JSX.Element | null => {
  if (applications.length === 0 || !applications[0].applicationRound == null) {
    return null;
  }
  const roundPk = applications[0].applicationRound.pk;
  if (roundPk == null) {
    return null;
  }

  return (
    <Wrapper data-testid="applications__group--wrapper">
      <GroupName>{name}</GroupName>
      {applications.map((application) => (
        <ApplicationCard
          key={application.pk}
          application={application}
          applicationRound={rounds[roundPk]}
          actionCallback={actionCallback}
        />
      ))}
    </Wrapper>
  );
};

export default ApplicationsGroup;
