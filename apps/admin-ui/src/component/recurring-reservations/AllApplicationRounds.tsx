import React from "react";
import { ApolloError, useQuery } from "@apollo/client";
import { groupBy, orderBy } from "lodash";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { H1 } from "common/src/common/typography";
import type { ApplicationRoundType, Query } from "common/types/gql-types";
import { applicationRoundUrl } from "../../common/urls";
import { formatDate } from "../../common/util";
import { useNotification } from "../../context/NotificationContext";
import { Container } from "../../styles/layout";
import BreadcrumbWrapper from "../BreadcrumbWrapper";
import Loader from "../Loader";
import ApplicationRoundCard from "./ApplicationRoundCard";
import { getApplicationRoundStatus } from "./ApplicationRoundStatusTag";
import { TableLink, CustomTable } from "./CustomTable";
import { APPLICATION_ROUNDS_QUERY } from "./queries";
import { truncate } from "./util";
import { Accordion } from "../../common/hds-fork/Accordion";

const AccordionContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--spacing-l);
`;

const StyledH1 = styled(H1).attrs({ $legacy: true })`
  margin-top: 0;
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
  rounds?: ApplicationRoundType[];
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

  // TODO autoload 2000 elements by default (same as in ReservationUnitFilter) or provide pagination
  const { data, loading } = useQuery<Query>(APPLICATION_ROUNDS_QUERY, {
    onError: (err: ApolloError) => {
      notifyError(err.message);
    },
  });

  const allApplicationRounds = data?.applicationRounds?.edges
    ?.map((ar) => ar?.node)
    ?.filter((ar): ar is ApplicationRoundType => ar !== null);
  const applicationRounds = groupBy(
    allApplicationRounds,
    (round) => getApplicationRoundStatus(round).group
  );

  if (loading) {
    return <Loader />;
  }

  if (!applicationRounds) {
    return null;
  }

  return (
    <>
      <BreadcrumbWrapper
        route={["recurring-reservations", "application-rounds"]}
      />

      <Container>
        <StyledH1>{t("MainMenu.applicationRounds")}</StyledH1>
        <RoundsAccordion
          initiallyOpen
          hideIfEmpty
          name={t("ApplicationRound.groupLabel.handling")}
          rounds={
            orderBy(
              applicationRounds.g1,
              ["status", "applicationPeriodEnd"],
              ["asc", "asc"]
            ) || []
          }
        />
        <RoundsAccordion
          name={t("ApplicationRound.groupLabel.notSent")}
          rounds={applicationRounds.g2 || []}
          hideIfEmpty
          initiallyOpen
        />
        <RoundsAccordion
          name={t("ApplicationRound.groupLabel.open")}
          rounds={
            orderBy(
              applicationRounds.g3,
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
              applicationRounds.g4,
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
          <CustomTable
            ariaLabelSortButtonAscending="Sorted in ascending order"
            ariaLabelSortButtonDescending="Sorted in descending order"
            ariaLabelSortButtonUnset="Not sorted"
            initialSortingColumnKey="applicantSort"
            initialSortingOrder="asc"
            cols={[
              {
                isSortable: true,
                headerName: t("ApplicationRound.headings.name"),
                transform: (applicationRound: ApplicationRoundType) => (
                  <TableLink
                    to={applicationRoundUrl(Number(applicationRound.pk))}
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
                transform: (applicationRound: ApplicationRoundType) =>
                  applicationRound.serviceSector?.nameFi ?? "",
                key: "serviceSectorName",
              },
              {
                isSortable: true,
                headerName: t("ApplicationRound.headings.reservationUnitCount"),
                transform: (applicationRound: ApplicationRoundType) =>
                  String(applicationRound.applicationsCount),
                key: "applicationsCount",
              },
              {
                isSortable: true,
                headerName: t("ApplicationRound.headings.applicationCount"),
                transform: (applicationRound: ApplicationRoundType) =>
                  String(applicationRound.reservationUnitCount),
                key: "reservationUnitCount",
              },
              {
                isSortable: true,
                headerName: t("ApplicationRound.headings.sent"),
                transform: (applicationRound: ApplicationRoundType) =>
                  formatDate(applicationRound.statusTimestamp || null) || "-",
                key: "statusTimestampSort",
              },
            ]}
            indexKey="pk"
            rows={
              orderBy(applicationRounds.g5, ["statusTimestamp"], ["desc"]).map(
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
