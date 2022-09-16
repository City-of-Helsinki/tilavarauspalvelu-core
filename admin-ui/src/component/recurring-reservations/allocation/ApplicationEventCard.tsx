import { IconAngleDown, IconAngleUp, Link, RadioButton } from "hds-react";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { publicUrl } from "../../../common/const";
import {
  ApplicationEventType,
  ApplicationType,
  ReservationUnitType,
} from "../../../common/gql-types";
import { AllocationApplicationEventCardType } from "../../../common/types";
import { parseDuration } from "../../../common/util";
import { FontBold, FontMedium } from "../../../styles/typography";
import { ageGroup } from "../../reservations/requested/util";
import {
  getApplicantName,
  getApplicationByApplicationEvent,
} from "../modules/applicationRoundAllocation";

type Props = {
  applicationEvent: ApplicationEventType;
  selectedApplicationEvent?: ApplicationEventType;
  setSelectedApplicationEvent: (val?: ApplicationEventType) => void;
  applications: ApplicationType[];
  reservationUnit: ReservationUnitType;
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

const StyledLink = styled(Link).attrs({
  style: {
    "--link-color": "var(--color-black)",
    "--link-visited-color": "var(--color-black)",
  },
})`
  && {
    ${FontMedium};
    border: 0;
    text-decoration: none;
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
      ${FontBold}
    }
  }
`;

const ApplicationEventCard = ({
  applicationEvent,
  selectedApplicationEvent,
  setSelectedApplicationEvent,
  applications,
  reservationUnit,
  type,
}: Props): JSX.Element => {
  const { t } = useTranslation();

  const [isExpanded, setIsExpanded] = useState(false);

  const application = getApplicationByApplicationEvent(
    applications,
    applicationEvent.pk as number
  );
  const applicantName = getApplicantName(application);
  const isActive = applicationEvent === selectedApplicationEvent;
  const parsedDuration =
    applicationEvent.minDuration === applicationEvent.maxDuration
      ? parseDuration(applicationEvent.minDuration)
      : `${parseDuration(applicationEvent.minDuration)} - ${parseDuration(
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
            href={`${publicUrl}/application/${application?.pk}/details`}
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
