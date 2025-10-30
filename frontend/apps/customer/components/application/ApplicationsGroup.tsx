import React from "react";
import { Flex, H2 } from "ui/src/styled";
import { type ApplicationsGroupFragment } from "@gql/gql-types";
import { ApplicationCard } from "./ApplicationCard";
import { gql } from "@apollo/client";

type Props = {
  name: string;
  applications: ApplicationsGroupFragment[];
  actionCallback: (string: "error" | "cancel") => Promise<void>;
};

export function ApplicationsGroup({ name, applications, actionCallback }: Props): JSX.Element | null {
  if (applications.length === 0) {
    return null;
  }
  applications.sort((a, b) => {
    return new Date(a.sentAt ?? 0).getTime() - new Date(b.sentAt ?? 0).getTime();
  });

  return (
    <Flex data-testid="applications__group--wrapper">
      <H2 $marginTop="l" $marginBottom="none">
        {name}
      </H2>
      {applications.map((application) => (
        <ApplicationCard key={application.pk} application={application} actionCallback={actionCallback} />
      ))}
    </Flex>
  );
}

export const APPLICATIONS_GROUP_FRAGMENT = gql`
  fragment ApplicationsGroup on ApplicationNode {
    ...ApplicationCard
    sentAt
  }
`;
