import { IconAngleDown, IconAngleUp, Link, RadioButton } from "hds-react";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { Strong } from "common/src/common/typography";
import type { ApplicationEventNode } from "common/types/gql-types";
import type { ReservationUnitNode } from "common";
import type { AllocationApplicationEventCardType } from "@/common/types";
import { publicUrl } from "@/common/const";
import { formatDuration } from "@/common/util";
import { getApplicantName } from "@/component/applications/util";
import { ageGroup } from "@/component/reservations/requested/util";

type Props = {
  applicationEvent: ApplicationEventNode;
  selectedApplicationEvent?: ApplicationEventNode;
  setSelectedApplicationEvent: (val?: ApplicationEventNode) => void;
  reservationUnit: ReservationUnitNode;
  type: AllocationApplicationEventCardType;
};

const Card = styled.button<{ $type: AllocationApplicationEventCardType }>`
  position: relative;
  border: 1px solid var(--color-black-10);
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  width: 100%;
  margin-bottom: var(--spacing-xs);
  padding: var(--spacing-2-xs) var(--spacing-xs) var(--spacing-xs);
  line-height: var(--lineheight-xl);
  font-size: var(--fontsize-body-s);
  background-color: ${({ $type }) =>
    $type === "allocated"
      ? "var(--color-gold-medium-light)"
      : $type === "declined"
        ? "var(--color-black-10)"
        : "transparent"};
`;

const StyledRadioButton = styled(RadioButton)`
  > label {
    &:before,
    &:after {
      top: 10px !important;
    }

    font-family: var(--font-medium);
    font-weight: 500;
    padding-left: var(--spacing-xl) !important;
  }
  cursor: pointer;
`;

const ToggleIcon = styled.div`
  position: absolute;
  top: var(--spacing-s);
  right: 6px;
  cursor: pointer;
`;

const Applicant = styled.div`
  padding-left: var(--spacing-xl);
  line-height: var(--lineheight-l);
`;

const Details = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  border-top: 1px solid var(--color-black-20);
  margin-top: var(--spacing-xs);
  padding-top: var(--spacing-xs);
`;

const StyledLink = styled(Link)`
  color: var(--color-black);
  text-decoration: none;
  font-size: var(--fontsize-body-s);
  border: 0;

  svg {
    width: 1rem;
    height: 1rem;
  }
`;

const DetailRow = styled.div`
  text-align: left;

  > span {
    &:nth-of-type(1) {
      white-space: nowrap;
      margin-right: var(--spacing-3-xs);
    }

    &:nth-of-type(2) {
      ${Strong}
    }
  }
`;

const ApplicationEventCard = ({
  applicationEvent,
  selectedApplicationEvent,
  setSelectedApplicationEvent,
  reservationUnit,
  type,
}: Props): JSX.Element | null => {
  const { t } = useTranslation();

  const [isExpanded, setIsExpanded] = useState(false);

  const application = applicationEvent.application ?? null;

  // TODO can we pass through without application?
  if (application?.pk == null) {
    // eslint-disable-next-line no-console
    console.warn("ApplicationEventCard: application is missing");
    return null;
  }
  if (!applicationEvent) {
    // eslint-disable-next-line no-console
    console.warn("ApplicationEventCard: applicationEvent is missing");
    return null;
  }

  const applicantName = getApplicantName(application);
  const isActive = applicationEvent === selectedApplicationEvent;
  const parsedDuration =
    applicationEvent.minDuration === applicationEvent.maxDuration
      ? formatDuration(applicationEvent.minDuration)
      : `${formatDuration(applicationEvent.minDuration)} - ${formatDuration(
          applicationEvent.maxDuration
        )}`;
  const otherReservationUnits = applicationEvent?.eventReservationUnits
    ?.flatMap((eventReservationUnit) => eventReservationUnit?.reservationUnit)
    .filter((ru) => ru?.pk !== reservationUnit.pk)
    .map((ru) => ru?.nameFi)
    .join(", ");

  return (
    <Card $type={type}>
      <StyledRadioButton
        id={`applicationEvent-${applicationEvent.pk}`}
        label={applicationEvent.name}
        checked={isActive}
        onClick={() =>
          isActive
            ? setSelectedApplicationEvent()
            : setSelectedApplicationEvent(applicationEvent)
        }
      />
      <ToggleIcon onClick={() => setIsExpanded(!isExpanded)}>
        {isExpanded ? <IconAngleUp /> : <IconAngleDown />}
      </ToggleIcon>
      <Applicant>{applicantName}</Applicant>
      {isExpanded && (
        <Details>
          <StyledLink
            href={`${publicUrl}/application/${application.pk}/details#${applicationEvent.pk}`}
            external
            openInNewTab
            openInExternalDomainAriaLabel={t("common.openToNewTab")}
          >
            {t("Allocation.openApplication")}
          </StyledLink>
          <DetailRow>
            <span>{t("Allocation.ageGroup")}:</span>
            <span>
              {t("common.agesSuffix", {
                range: ageGroup(applicationEvent.ageGroup),
              })}
            </span>
          </DetailRow>
          <DetailRow>
            <span>{t("Allocation.applicationsWeek")}:</span>
            <span>
              {parsedDuration}, {applicationEvent.eventsPerWeek}x
            </span>
          </DetailRow>
          <DetailRow>
            <span>{t("Allocation.otherReservationUnits")}:</span>
            <span>{otherReservationUnits || "-"}</span>
          </DetailRow>
        </Details>
      )}
    </Card>
  );
};

export default ApplicationEventCard;
