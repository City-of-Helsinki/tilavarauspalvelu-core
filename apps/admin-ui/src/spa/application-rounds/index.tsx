import React from "react";
import { type ApolloError } from "@apollo/client";
import { orderBy } from "lodash";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { H1 } from "common/src/common/typography";
import {
  ApplicationRoundStatusChoice,
  type ApplicationRoundNode,
  type ApplicationRoundsQuery,
  useApplicationRoundsQuery,
} from "@gql/gql-types";
import { filterNonNullable } from "common/src/helpers";
import { getApplicationRoundUrl } from "@/common/urls";
import { formatDate } from "@/common/util";
import { errorToast } from "common/src/common/toast";
import { truncate } from "@/helpers";
import { ApplicationRoundCard } from "./ApplicationRoundCard";
import { TableLink } from "@/styles/util";
import { CustomTable } from "@/component/Table";
import Error404 from "@/common/Error404";
import { Accordion } from "hds-react";
import { CenterSpinner, Flex } from "common/styles/util";

const AccordionWithoutTopPadding = styled(Accordion).attrs({
  closeButton: false,
})`
  & > div > div {
    width: 100%;
  }
  & [class*="Accordion-module_accordionHeader__"] {
    padding-top: 0;
    margin-top: 0;
  }
`;

// NOTE fix table overflowing the page on mobile
const StyledAccordion = styled(AccordionWithoutTopPadding).attrs({
  closeButton: false,
})`
  & > div > div {
    display: grid;
    width: 100%;
  }
  {/* This is to give more space to the name-column in the previous rounds table */}
  &.previous-rounds td:first-child {
    width: 50%;
  }
`;

type ApplicationRoundListType = NonNullable<
  ApplicationRoundsQuery["applicationRounds"]
>;
type ApplicationRoundType = NonNullable<
  NonNullable<ApplicationRoundListType["edges"]>[0]
>["node"];

function RoundsAccordion({
  rounds,
  name,
  hideIfEmpty = false,
  initiallyOpen,
  emptyContent,
}: {
  rounds: NonNullable<ApplicationRoundType>[];
  hideIfEmpty?: boolean;
  name: string;
  initiallyOpen?: boolean;
  emptyContent?: JSX.Element;
}): JSX.Element | null {
  if (rounds.length === 0 && hideIfEmpty) {
    return null;
  }

  return (
    <AccordionWithoutTopPadding heading={name} initiallyOpen={initiallyOpen}>
      <Flex $gap="l">
        {!rounds || rounds.length === 0
          ? emptyContent || <span>no data {name}</span>
          : rounds?.map((round) => (
              <ApplicationRoundCard
                key={round?.pk ?? 0}
                applicationRound={round}
              />
            ))}
      </Flex>
    </AccordionWithoutTopPadding>
  );
}

function AllApplicationRounds(): JSX.Element | null {
  const { t } = useTranslation();

  // TODO pagination
  const { data, loading, error } = useApplicationRoundsQuery({
    onError: (err: ApolloError) => {
      errorToast({ text: err.message });
    },
  });

  const allApplicationRounds = filterNonNullable(
    data?.applicationRounds?.edges?.map((ar) => ar?.node)
  );

  if (loading && allApplicationRounds == null) {
    return <CenterSpinner />;
  }

  if (allApplicationRounds == null || error != null) {
    // TODO should be a different error page
    return <Error404 />;
  }

  const currentApplicationRounds = allApplicationRounds.filter(
    (ar) => ar.status === ApplicationRoundStatusChoice.InAllocation
  );
  const openApplicationRounds = allApplicationRounds.filter(
    (ar) => ar.status === ApplicationRoundStatusChoice.Open
  );
  const sentApplicationRounds = allApplicationRounds.filter(
    (ar) => ar.status === ApplicationRoundStatusChoice.ResultsSent
  );
  const upcomingApplicationRounds = allApplicationRounds.filter(
    (ar) => ar.status === ApplicationRoundStatusChoice.Upcoming
  );
  const handledApplicationRounds = allApplicationRounds.filter(
    (ar) => ar.status === ApplicationRoundStatusChoice.Handled
  );

  const cols = [
    {
      isSortable: true,
      headerName: t("ApplicationRound.headings.name"),
      transform: (applicationRound: ApplicationRoundNode) => (
        <TableLink to={getApplicationRoundUrl(applicationRound.pk)}>
          <span title={applicationRound.nameFi ?? ""}>
            {truncate(applicationRound.nameFi ?? "", 50)}
          </span>
        </TableLink>
      ),
      key: "nameFi",
    },
    {
      isSortable: true,
      headerName: t("ApplicationRound.headings.reservationUnitCount"),
      transform: (applicationRound: ApplicationRoundNode) =>
        String(applicationRound.applicationsCount),
      key: "applicationsCount",
    },
    {
      isSortable: true,
      headerName: t("ApplicationRound.headings.applicationCount"),
      transform: (applicationRound: ApplicationRoundNode) =>
        String(applicationRound.reservationUnitCount),
      key: "reservationUnitCount",
    },
    {
      isSortable: true,
      headerName: t("ApplicationRound.headings.sent"),
      transform: (applicationRound: ApplicationRoundNode) =>
        formatDate(applicationRound.statusTimestamp || null) || "-",
      key: "statusTimestampSort",
    },
  ];

  const rows = orderBy(
    sentApplicationRounds,
    ["statusTimestamp"],
    ["desc"]
  ).map((a) => ({
    ...a,
    statusTimestampSort: new Date(a.statusTimestamp || "").getTime(),
  }));

  return (
    <>
      <div>
        <H1 $marginTop="l">{t("MainMenu.applicationRounds")}</H1>
        <p>{t("ApplicationRound.description")}</p>
      </div>
      <RoundsAccordion
        initiallyOpen
        hideIfEmpty
        name={t("ApplicationRound.groupLabel.handling")}
        rounds={orderBy(
          currentApplicationRounds,
          ["status", "applicationPeriodEnd"],
          ["asc", "asc"]
        )}
      />
      <RoundsAccordion
        name={t("ApplicationRound.groupLabel.notSent")}
        rounds={handledApplicationRounds}
        hideIfEmpty
        initiallyOpen
      />
      <RoundsAccordion
        name={t("ApplicationRound.groupLabel.open")}
        rounds={orderBy(
          openApplicationRounds,
          ["applicationPeriodEnd", "asc"],
          []
        )}
        hideIfEmpty
        initiallyOpen
      />
      <RoundsAccordion
        name={t("ApplicationRound.groupLabel.opening")}
        rounds={orderBy(
          upcomingApplicationRounds,
          ["applicationPeriodBegin"],
          ["asc"]
        )}
        emptyContent={
          <div>
            <div>{t("ApplicationRound.noUpcoming")}</div>
          </div>
        }
      />
      <StyledAccordion
        heading={t("ApplicationRound.groupLabel.previousRounds")}
        className="previous-rounds"
      >
        <CustomTable
          enableFrontendSorting
          initialSortingColumnKey="applicantSort"
          initialSortingOrder="asc"
          cols={cols}
          indexKey="pk"
          rows={rows}
          variant="light"
        />
      </StyledAccordion>
    </>
  );
}

export default AllApplicationRounds;
