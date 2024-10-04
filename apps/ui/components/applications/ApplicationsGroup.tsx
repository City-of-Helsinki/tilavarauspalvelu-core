import React from "react";
import styled from "styled-components";
import { H3 } from "common/src/common/typography";
import { type ApplicationsQuery } from "@gql/gql-types";
import ApplicationCard from "./ApplicationCard";

const GroupName = styled(H3).attrs({ as: "h2" })`
  margin-top: 0;
`;

type Props = {
  name: string;
  applications: NonNullable<
    NonNullable<
      NonNullable<ApplicationsQuery["applications"]>["edges"][0]
    >["node"]
  >[];
  actionCallback: (string: "error" | "cancel") => Promise<void>;
};

const Wrapper = styled.div`
  display: flex;
  flex-flow: column nowrap;
  gap: var(--spacing-m);
  margin-bottom: var(--spacing-layout-l);
`;

function ApplicationsGroup({
  name,
  applications,
  actionCallback,
}: Props): JSX.Element | null {
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
          actionCallback={actionCallback}
        />
      ))}
    </Wrapper>
  );
}

export default ApplicationsGroup;
