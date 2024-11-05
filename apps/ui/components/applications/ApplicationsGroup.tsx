import React from "react";
import styled from "styled-components";
import { H2 } from "common/src/common/typography";
import { type ApplicationsQuery } from "@gql/gql-types";
import ApplicationCard from "./ApplicationCard";
import { Flex } from "common/styles/util";

type Props = {
  name: string;
  applications: NonNullable<
    NonNullable<
      NonNullable<ApplicationsQuery["applications"]>["edges"][0]
    >["node"]
  >[];
  actionCallback: (string: "error" | "cancel") => Promise<void>;
};

const Wrapper = styled(Flex)`
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
  applications.sort((a, b) => {
    return (
      new Date(a.sentDate ?? 0).getTime() - new Date(b.sentDate ?? 0).getTime()
    );
  });

  return (
    <Wrapper data-testid="applications__group--wrapper">
      <H2 $noMargin>{name}</H2>
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
