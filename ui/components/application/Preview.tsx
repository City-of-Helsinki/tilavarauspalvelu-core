import React, { useEffect, useState } from "react";
import { Checkbox, IconArrowLeft, Notification } from "hds-react";
import { useTranslation } from "react-i18next";
import Link from "next/link";
import { useRouter } from "next/router";
import styled from "styled-components";
import { Application, ReservationUnit, Parameter } from "../../modules/types";
import {
  deepCopy,
  formatDuration,
  getTranslation,
  localizedValue,
} from "../../modules/util";
import { getParameters, getReservationUnit } from "../../modules/api";
import LabelValue from "../common/LabelValue";
import TimePreview from "../common/TimePreview";
import ApplicantInfoPreview from "./ApplicantInfoPreview";
import { TwoColumnContainer } from "../common/common";
import { AccordionWithState as Accordion } from "../common/Accordion";
import { breakpoint } from "../../modules/style";
import { MediumButton } from "../../styles/util";
import { TermsOfUseType } from "../../modules/gql-types";

type Props = {
  application: Application;
  onNext: (application: Application) => void;
  tos: TermsOfUseType[];
};

const mapArrayById = (
  array: { id: number }[]
): { [key: number]: { id: number } } => {
  return array.reduce((prev, current) => {
    // eslint-disable-next-line no-param-reassign
    prev[current.id] = current;
    return prev;
  }, {} as { [key: number]: Parameter | ReservationUnit });
};

const ButtonContainer = styled.div`
  display: flex;
  flex-direction: row;
  margin: var(--spacing-layout-l) 0;
  justify-content: flex-end;

  button {
    margin-left: var(--spacing-layout-xs);
  }
`;
const BuildingName = styled.div`
  font-family: var(--font-regular);
`;

const UnitName = styled.div`
  font-family: var(--font-bold);
`;

const Ruler = styled.hr`
  margin-top: var(--spacing-layout-m);
  border-left: none;
  border-right: none;
`;

const SmallSubHeadline = styled.div`
  font-family: var(--font-bold);
  margin-top: var(--spacing-layout-m);
  font-size: var(--fontsize-heading-m);
`;

const TimePreviewContainer = styled.div`
  margin: var(--spacing-xl) 0;

  svg {
    margin-top: 2px;
  }
`;

const CheckboxContainer = styled.div`
  margin-top: var(--spacing-layout-l);
  display: flex;
  align-items: center;
`;

const StyledNotification = styled(Notification)`
  line-height: var(--fontsize-heading-m);
  margin-top: var(--spacing-m);

  svg {
    position: relative;
    top: -2px;
  }
`;

const Terms = styled.div`
  margin-top: var(--spacing-s);
  width: (--container-width-m);
  white-space: break-spaces;
  height: 20em;
  overflow-y: scroll;
  background-color: var(--color-white);
  padding: var(--spacing-s);

  @media (max-width: ${breakpoint.m}) {
    height: auto;
    background-color: transparent;
    padding: 0;
    overflow-y: none;
  }
`;

const Preview = ({ onNext, application, tos }: Props): JSX.Element | null => {
  const [ready, setReady] = useState(false);

  const [ageGroupOptions, setAgeGroupOptions] = useState<{
    [key: number]: Parameter;
  }>({});
  const [purposeOptions, setPurposeOptions] = useState<{
    [key: number]: Parameter;
  }>({});
  const [reservationUnits, setReservationUnits] = useState<{
    [key: number]: ReservationUnit;
  }>({});
  const [cities, setCities] = useState<{
    [key: number]: Parameter;
  }>({});

  const [acceptTermsOfUse, setAcceptTermsOfUse] = useState(false);
  const { i18n } = useTranslation();
  const router = useRouter();

  useEffect(() => {
    let mounted = true;
    async function fetchData() {
      const reservationUnitIds = Array.from(
        new Set(
          application.applicationEvents.flatMap(
            (ae) => ae.eventReservationUnits
          )
        )
      );

      const fetchedReservationUnits = await Promise.all(
        reservationUnitIds.map((ru) => getReservationUnit(ru.reservationUnitId))
      );

      if (mounted) {
        setReservationUnits(
          mapArrayById(fetchedReservationUnits) as {
            [key: number]: ReservationUnit;
          }
        );
      }

      const fetchedAgeGroupOptions = await getParameters("age_group");
      if (mounted) {
        setAgeGroupOptions(mapArrayById(fetchedAgeGroupOptions));
      }
      const fetchedPurposeOptions = await getParameters("purpose");
      if (mounted) {
        setPurposeOptions(mapArrayById(fetchedPurposeOptions));
      }
      const fetchedCityOptions = await getParameters("city");
      if (mounted) {
        setCities(mapArrayById(fetchedCityOptions));
        setReady(true);
      }
    }
    fetchData();

    return () => {
      mounted = false;
    };
  }, [application]);

  const { t } = useTranslation();

  const prepareData = (data: Application): Application => {
    const applicationCopy = deepCopy(data);
    applicationCopy.status = "in_review";
    return applicationCopy;
  };

  const onSubmit = (data: Application): void => {
    const appToSave = prepareData(data);
    onNext(appToSave);
  };

  // application not saved yet
  if (!application.id) {
    return (
      <>
        <h1>{t("application:preview.noData.heading")}</h1>
        <Link href="page1">
          <a>{t("application:preview.noData.text")}</a>
        </Link>
      </>
    );
  }

  const tos1 = tos.find((n) => n.pk === "generic1");
  const tos2 = tos.find((n) => n.pk === "KUVAnupa");

  return ready ? (
    <>
      <Accordion
        open
        id="basicInfo"
        heading={t("application:preview.basicInfoSubHeading")}
      >
        <ApplicantInfoPreview cities={cities} application={application} />
      </Accordion>
      {application.applicationEvents.map((applicationEvent, i) => {
        const summaryDataPrimary =
          applicationEvent.applicationEventSchedules.filter(
            (n) => n.priority === 300
          );
        const summaryDataSecondary =
          applicationEvent.applicationEventSchedules.filter(
            (n) => n.priority === 200
          );

        return (
          <Accordion
            open
            id={`applicationEvent-${i}`}
            key={applicationEvent.id}
            heading={applicationEvent.name || ""}
          >
            <TwoColumnContainer>
              <LabelValue
                label={t("application:preview.applicationEvent.name")}
                value={applicationEvent.name}
              />
              <LabelValue
                label={t("application:preview.applicationEvent.numPersons")}
                value={applicationEvent.numPersons}
              />
              <LabelValue
                label={t("application:preview.applicationEvent.ageGroup")}
                value={
                  applicationEvent.ageGroupId
                    ? `${
                        ageGroupOptions[applicationEvent.ageGroupId].minimum
                      } - ${
                        ageGroupOptions[applicationEvent.ageGroupId].maximum
                      }`
                    : ""
                }
              />
              <LabelValue
                label={t("application:preview.applicationEvent.purpose")}
                value={
                  applicationEvent.purposeId != null
                    ? localizedValue(
                        purposeOptions[applicationEvent.purposeId].name,
                        i18n.language
                      )
                    : ""
                }
              />
              <LabelValue
                label={t("application:preview.applicationEvent.begin")}
                value={applicationEvent.begin || ""}
              />
              <LabelValue
                label={t("application:preview.applicationEvent.end")}
                value={applicationEvent.end || ""}
              />
              <LabelValue
                label={t("application:preview.applicationEvent.minDuration")}
                value={formatDuration(applicationEvent.minDuration as string)}
              />
              <LabelValue
                label={t("application:preview.applicationEvent.maxDuration")}
                value={formatDuration(applicationEvent.maxDuration as string)}
              />
              <LabelValue
                label={t("application:preview.applicationEvent.eventsPerWeek")}
                value={applicationEvent.eventsPerWeek}
              />
              <div />
              {/* <LabelValue
              label={t("application:preview.applicationEvent.biweekly")}
              value={t(`common:${applicationEvent.biweekly}`) as string}
            /> */}
              {applicationEvent.eventReservationUnits.map(
                (reservationUnit, index) => (
                  <LabelValue
                    key={reservationUnit.reservationUnitId}
                    label={t(
                      "application:preview.applicationEvent.reservationUnit",
                      { order: index + 1 }
                    )}
                    value={[
                      <UnitName>
                        {localizedValue(
                          reservationUnits[reservationUnit.reservationUnitId]
                            .name,
                          i18n.language
                        )}
                      </UnitName>,
                      <BuildingName>
                        {localizedValue(
                          reservationUnits[reservationUnit.reservationUnitId]
                            .building?.name,
                          i18n.language
                        )}
                      </BuildingName>,
                    ]}
                  />
                )
              )}
            </TwoColumnContainer>
            <Ruler />
            <SmallSubHeadline>
              {t("application:preview.applicationEventSchedules")}
            </SmallSubHeadline>
            <TimePreviewContainer data-testid={`time-selector__preview-${i}`}>
              <TimePreview
                applicationEventSchedules={[
                  summaryDataPrimary,
                  summaryDataSecondary,
                ]}
              />
            </TimePreviewContainer>
          </Accordion>
        );
      })}
      <SmallSubHeadline>{t("reservationUnit:termsOfUse")}</SmallSubHeadline>
      <Terms tabIndex={0}>{getTranslation(tos1, "text")}</Terms>
      <SmallSubHeadline>
        {t("application:preview.reservationUnitTerms")}
      </SmallSubHeadline>
      <Terms tabIndex={0}>{getTranslation(tos2, "text")}</Terms>
      <CheckboxContainer>
        <Checkbox
          id="preview.acceptTermsOfUse"
          checked={acceptTermsOfUse}
          onChange={(e) => setAcceptTermsOfUse(e.target.checked)}
          label={t("application:preview.userAcceptsTerms")}
        />
      </CheckboxContainer>
      <StyledNotification
        label={t("application:preview.notification.processing")}
      >
        {t("application:preview.notification.body")}
      </StyledNotification>
      <ButtonContainer>
        <MediumButton
          variant="secondary"
          iconLeft={<IconArrowLeft />}
          onClick={() => router.push(`${application.id}/page3`)}
        >
          {t("common:prev")}
        </MediumButton>
        <MediumButton
          id="submit"
          onClick={() => {
            onSubmit(application);
          }}
          disabled={!acceptTermsOfUse}
        >
          {t("common:submit")}
        </MediumButton>
      </ButtonContainer>
    </>
  ) : null;
};

export default Preview;
