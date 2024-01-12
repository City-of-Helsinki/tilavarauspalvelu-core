import React from "react";
import { ApolloError, useQuery } from "@apollo/client";
import { orderBy } from "lodash";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { H1 } from "common/src/common/typography";
import {
  ApplicationRoundStatusChoice,
  type ApplicationRoundNode,
  type Query,
} from "common/types/gql-types";
import { filterNonNullable } from "common/src/helpers";
import { applicationRoundUrl } from "@/common/urls";
import { formatDate } from "@/common/util";
import { Accordion } from "@/common/hds-fork/Accordion";
import { useNotification } from "@/context/NotificationContext";
import { Container } from "@/styles/layout";
import { truncate } from "@/helpers";
import BreadcrumbWrapper from "@/component/BreadcrumbWrapper";
import Loader from "@/component/Loader";
import { ApplicationRoundCard } from "./ApplicationRoundCard";
import { TableLink } from "@/component/lists/components";
import { StyledHDSTable } from "./CustomTable";
import { APPLICATION_ROUNDS_QUERY } from "./queries";

const AccordionContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--spacing-l);
`;

// NOTE fix table overflowing the page on mobile
const StyledAccordion = styled(Accordion)`
  & > div > div {
    display: grid;
  }
`;

const RoundsAccordion = ({
  rounds,
  hideIfEmpty,
  name,
  initiallyOpen,
  emptyContent,
}: {
  rounds?: ApplicationRoundNode[];
  hideIfEmpty?: boolean;
  name: string;
  initiallyOpen?: boolean;
  emptyContent?: JSX.Element;
}): JSX.Element | null => {
  if (!rounds || rounds.length === 0) {
    if (hideIfEmpty) {
      return null;
    }
  }

  return (
    <Accordion heading={name} initiallyOpen={initiallyOpen}>
      <AccordionContainer>
        {!rounds || rounds.length === 0
          ? emptyContent || <span>no data {name}</span>
          : rounds?.map((round) => (
              <ApplicationRoundCard key={round.pk} applicationRound={round} />
            ))}
      </AccordionContainer>
    </Accordion>
  );
};

function AllApplicationRounds(): JSX.Element | null {
  const { t } = useTranslation();
  const { notifyError } = useNotification();

  // TODO pagination
  const { data, loading } = useQuery<Query>(APPLICATION_ROUNDS_QUERY, {
    onError: (err: ApolloError) => {
      notifyError(err.message);
    },
  });

  const allApplicationRounds = filterNonNullable(
    data?.applicationRounds?.edges?.map((ar) => ar?.node)
  );

  if (loading) {
    return <Loader />;
  }

  if (!allApplicationRounds) {
    return null;
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

  return (
    <>
      <BreadcrumbWrapper
        route={["recurring-reservations", "application-rounds"]}
      />
      <Container>
        <div>
          <H1 $legacy>{t("MainMenu.applicationRounds")}</H1>
          <p>{t("ApplicationRound.description")}</p>
        </div>
        <RoundsAccordion
          initiallyOpen
          hideIfEmpty
          name={t("ApplicationRound.groupLabel.handling")}
          rounds={
            orderBy(
              currentApplicationRounds,
              ["status", "applicationPeriodEnd"],
              ["asc", "asc"]
            ) || []
          }
        />
        <RoundsAccordion
          name={t("ApplicationRound.groupLabel.notSent")}
          rounds={handledApplicationRounds}
          hideIfEmpty
          initiallyOpen
        />
        <RoundsAccordion
          name={t("ApplicationRound.groupLabel.open")}
          rounds={
            orderBy(
              openApplicationRounds,
              ["applicationPeriodEnd", "asc"],
              []
            ) || []
          }
          hideIfEmpty
          initiallyOpen
        />
        <RoundsAccordion
          name={t("ApplicationRound.groupLabel.opening")}
          rounds={
            orderBy(
              upcomingApplicationRounds,
              ["applicationPeriodBegin"],
              ["asc"]
            ) || []
          }
          emptyContent={
            <div>
              <div>{t("ApplicationRound.noUpcoming")}</div>
            </div>
          }
        />
        <StyledAccordion
          heading={t("ApplicationRound.groupLabel.previousRounds")}
        >
          <StyledHDSTable
            ariaLabelSortButtonAscending="Sorted in ascending order"
            ariaLabelSortButtonDescending="Sorted in descending order"
            ariaLabelSortButtonUnset="Not sorted"
            initialSortingColumnKey="applicantSort"
            initialSortingOrder="asc"
            cols={[
              {
                isSortable: true,
                headerName: t("ApplicationRound.headings.name"),
                transform: (applicationRound: ApplicationRoundNode) => (
                  <TableLink
                    href={applicationRoundUrl(Number(applicationRound.pk))}
                  >
                    <span title={applicationRound.nameFi ?? ""}>
                      {truncate(applicationRound.nameFi ?? "", 20)}
                    </span>
                  </TableLink>
                ),
                key: "nameFi",
              },
              {
                headerName: t("ApplicationRound.headings.service"),
                transform: (applicationRound: ApplicationRoundNode) =>
                  applicationRound.serviceSector?.nameFi ?? "",
                key: "serviceSectorName",
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
            ]}
            indexKey="pk"
            rows={
              orderBy(sentApplicationRounds, ["statusTimestamp"], ["desc"]).map(
                (a) => ({
                  ...a,
                  statusTimestampSort: new Date(
                    a.statusTimestamp || ""
                  ).getTime(),
                })
              ) || []
            }
            variant="light"
          />
        </StyledAccordion>
      </Container>
    </>
  );
}

export default AllApplicationRounds;
