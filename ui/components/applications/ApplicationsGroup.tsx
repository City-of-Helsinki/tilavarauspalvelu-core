import React from "react";
import styled from "styled-components";
import { ApplicationRoundType, ApplicationType } from "../../modules/gql-types";
import { H3 } from "../../modules/style/typography";
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
  if (!applications.length) {
    return null;
  }

  return (
    <Wrapper data-testid="applications__group--wrapper">
      <GroupName>{name}</GroupName>
      {applications.map((application) => (
        <ApplicationCard
          key={application.pk}
          application={application}
          applicationRound={rounds[application.applicationRoundId]}
          actionCallback={actionCallback}
        />
      ))}
    </Wrapper>
  );
};

export default ApplicationsGroup;
