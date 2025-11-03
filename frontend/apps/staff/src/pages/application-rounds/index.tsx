import React from "react";
import { gql } from "@apollo/client";
import { ApplicationRoundCard } from "@lib/application-rounds";
import { Accordion } from "hds-react";
import { orderBy } from "lodash-es";
import { type GetServerSidePropsContext } from "next";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import styled from "styled-components";
import { formatDate, parseValidDateObject } from "ui/src/modules/date-utils";
import { filterNonNullable } from "ui/src/modules/helpers";
import { CenterSpinner, Flex, H1 } from "ui/src/styled";
import { AuthorizationChecker } from "@/components/AuthorizationChecker";
import { Error404 } from "@/components/Error404";
import { CustomTable } from "@/components/Table";
import { truncate } from "@/modules/helpers";
import { getCommonServerSideProps } from "@/modules/serverUtils";
import { getApplicationRoundUrl } from "@/modules/urls";
import { TableLink } from "@/styled";
import {
  ApplicationRoundStatusChoice,
  type ApplicationRoundNode,
  useApplicationRoundListQuery,
  type ApplicationRoundListElementFragment,
  UserPermissionChoice,
} from "@gql/gql-types";

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

function RoundsAccordion({
  rounds,
  name,
  hideIfEmpty = false,
  initiallyOpen,
  emptyContent,
}: {
  rounds: ApplicationRoundListElementFragment[];
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
          : rounds?.map((round) => <ApplicationRoundCard key={round?.pk ?? 0} applicationRound={round} />)}
      </Flex>
    </AccordionWithoutTopPadding>
  );
}

function AllApplicationRounds(): JSX.Element | null {
  const { t } = useTranslation();

  // TODO pagination
  const { data, loading, error } = useApplicationRoundListQuery();

  const allApplicationRounds = filterNonNullable(data?.applicationRounds?.edges?.map((ar) => ar?.node));

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
  const openApplicationRounds = allApplicationRounds.filter((ar) => ar.status === ApplicationRoundStatusChoice.Open);
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
      headerName: t("applicationRound:headings.name"),
      transform: (applicationRound: ApplicationRoundNode) => (
        <TableLink href={getApplicationRoundUrl(applicationRound.pk)}>
          <span title={applicationRound.nameFi ?? ""}>{truncate(applicationRound.nameFi ?? "", 50)}</span>
        </TableLink>
      ),
      key: "nameFi",
    },
    {
      isSortable: true,
      headerName: t("applicationRound:headings.reservationUnitCount"),
      transform: (applicationRound: ApplicationRoundNode) => String(applicationRound.applicationsCount),
      key: "applicationsCount",
    },
    {
      isSortable: true,
      headerName: t("applicationRound:headings.applicationCount"),
      transform: (applicationRound: ApplicationRoundNode) => String(applicationRound.reservationUnitCount),
      key: "reservationUnitCount",
    },
    {
      isSortable: true,
      headerName: t("applicationRound:headings.sent"),
      transform: (applicationRound: ApplicationRoundNode) =>
        applicationRound.statusTimestamp ? formatDate(parseValidDateObject(applicationRound.statusTimestamp)) : "-",
      key: "statusTimestampSort",
    },
  ];

  const rows = orderBy(sentApplicationRounds, ["statusTimestamp"], ["desc"]).map((a) => ({
    ...a,
    statusTimestampSort: new Date(a.statusTimestamp || "").getTime(),
  }));

  return (
    <>
      <div>
        <H1 $marginTop="l">{t("navigation:applicationRounds")}</H1>
        <p>{t("applicationRound:description")}</p>
      </div>
      <RoundsAccordion
        initiallyOpen
        hideIfEmpty
        name={t("applicationRound:groupLabel.handling")}
        rounds={orderBy(currentApplicationRounds, ["status", "applicationPeriodEndsAt"], ["asc", "asc"])}
      />
      <RoundsAccordion
        name={t("applicationRound:groupLabel.notSent")}
        rounds={handledApplicationRounds}
        hideIfEmpty
        initiallyOpen
      />
      <RoundsAccordion
        name={t("applicationRound:groupLabel.open")}
        rounds={orderBy(openApplicationRounds, ["applicationPeriodEndsAt", "asc"], [])}
        hideIfEmpty
        initiallyOpen
      />
      <RoundsAccordion
        name={t("applicationRound:groupLabel.opening")}
        rounds={orderBy(upcomingApplicationRounds, ["applicationPeriodBeginsAt"], ["asc"])}
        emptyContent={
          <div>
            <div>{t("applicationRound:noUpcoming")}</div>
          </div>
        }
      />
      <StyledAccordion heading={t("applicationRound:groupLabel.previousRounds")} className="previous-rounds">
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

type PageProps = Awaited<ReturnType<typeof getServerSideProps>>["props"];
export default function Page(props: PageProps): JSX.Element {
  return (
    <AuthorizationChecker apiUrl={props.apiBaseUrl} permission={UserPermissionChoice.CanManageApplications}>
      <AllApplicationRounds />
    </AuthorizationChecker>
  );
}

export async function getServerSideProps({ locale }: GetServerSidePropsContext) {
  return {
    props: {
      ...(await getCommonServerSideProps()),
      ...(await serverSideTranslations(locale ?? "fi")),
    },
  };
}

export const APPLICATION_ROUND_LIST_FRAGMENT = gql`
  fragment ApplicationRoundListElement on ApplicationRoundNode {
    ...ApplicationRoundCard
    statusTimestamp
  }
`;

export const APPLICATION_ROUND_LIST_QUERY = gql`
  query ApplicationRoundList {
    applicationRounds(onlyWithPermissions: true) {
      edges {
        node {
          ...ApplicationRoundListElement
        }
      }
    }
  }
`;
