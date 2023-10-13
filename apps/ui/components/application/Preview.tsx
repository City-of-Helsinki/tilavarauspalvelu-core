import React, { useEffect, useState } from "react";
import { Checkbox, Notification } from "hds-react";
import { useTranslation } from "next-i18next";
import Link from "next/link";
import { get, sortBy, trim } from "lodash";
import { useRouter } from "next/router";
import styled from "styled-components";
import { formatDuration } from "common/src/common/util";
import { Application, ReservationUnit, Parameter } from "common/types/common";
import { fontRegular } from "common/src/common/typography";
import { breakpoints } from "common/src/common/style";
import { TermsOfUseType } from "common/types/gql-types";
import { deepCopy, getTranslation, localizedValue } from "@/modules/util";
import { getReservationUnit } from "@/modules/api";
import { useOptions } from "@/hooks/useOptions";
import { MediumButton } from "@/styles/util";
import { getOldReservationUnitName } from "@/modules/reservationUnit";
import LabelValue from "../common/LabelValue";
import TimePreview from "../common/TimePreview";
import ApplicantInfoPreview from "./ApplicantInfoPreview";
import {
  ButtonContainer,
  FormSubHeading,
  TwoColumnContainer,
} from "../common/common";
import { AccordionWithState as Accordion } from "../common/Accordion";

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

const UnitList = styled.ol`
  margin: 0 0 var(--spacing-layout-l);
  padding: 0;
  ${fontRegular};
  width: 100%;
  list-style: none;
`;

const UnitName = styled.li`
  padding: var(--spacing-m) var(--spacing-xs);
  border-bottom: 1px solid var(--color-black-20);
  display: flex;
  gap: var(--spacing-xl);
`;

const TimePreviewContainer = styled.div`
  margin: var(--spacing-xl) 0;

  svg {
    margin-top: 2px;
  }
`;

const CheckboxContainer = styled.div`
  margin-top: var(--spacing-m);
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

const StyledLabelValue = styled(LabelValue).attrs({ theme: "thin" })``;

const Terms = styled.div`
  margin-top: var(--spacing-s);
  width: (--container-width-m);
  white-space: break-spaces;
  height: 20em;
  overflow-y: scroll;
  background-color: var(--color-white);
  padding: var(--spacing-s);
  border: 1px solid var(--color-black-90);

  @media (max-width: ${breakpoints.m}) {
    height: auto;
    background-color: transparent;
    padding: 0;
    overflow-y: none;
  }
`;

const Preview = ({ onNext, application, tos }: Props): JSX.Element | null => {
  const { i18n } = useTranslation();

  const [ready, setReady] = useState(false);

  // TODO replace this with a Array<{ pk: number, name: string, unitName }>
  // though we also need translations for the names nameFi, nameSv, nameEn
  // TODO pass it as a prop also don't fetch it here
  const [reservationUnits, setReservationUnits] = useState<{
    [key: number]: ReservationUnit;
  }>({});

  const [acceptTermsOfUse, setAcceptTermsOfUse] = useState(false);
  const router = useRouter();

  const { options, params } = useOptions();
  const { purposeOptions } = options;
  const citiesOptions = options.cityOptions;
  const { ageGroups } = params;

  // FIXME replace with GQL query
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
      if (mounted) {
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

  if (!ready) {
    return null;
  }

  return (
    <>
      <Accordion
        open
        id="basicInfo"
        heading={t("application:preview.basicInfoSubHeading")}
        theme="thin"
      >
        <ApplicantInfoPreview
          cities={citiesOptions}
          application={application}
        />
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
            theme="thin"
          >
            <TwoColumnContainer>
              <FormSubHeading>
                {t("application:preview.subHeading.applicationInfo")}
              </FormSubHeading>
              <StyledLabelValue
                label={t("application:preview.applicationEvent.name")}
                value={applicationEvent.name}
              />
              <StyledLabelValue
                label={t("application:preview.applicationEvent.numPersons")}
                value={applicationEvent.numPersons}
              />
              <StyledLabelValue
                label={t("application:preview.applicationEvent.ageGroup")}
                value={(() => {
                  if (!applicationEvent.ageGroupId) {
                    return "";
                  }
                  const fid = ageGroups.find(
                    (ag) => ag.pk === applicationEvent.ageGroupId
                  );
                  if (!fid) {
                    return "";
                  }
                  return `${fid.minimum} - ${fid.maximum}`;
                })()}
              />
              <StyledLabelValue
                label={t("application:preview.applicationEvent.purpose")}
                value={
                  // TODO check if this is correct (id)
                  applicationEvent.purposeId
                    ? purposeOptions.find(
                        (n) =>
                          n.value === applicationEvent.purposeId?.toString()
                      )?.label
                    : ""
                }
              />
              <StyledLabelValue
                label={t("application:preview.applicationEvent.begin")}
                value={applicationEvent.begin ?? "-"}
              />
              <StyledLabelValue
                label={t("application:preview.applicationEvent.end")}
                value={applicationEvent.end ?? "-"}
              />
              <StyledLabelValue
                label={t("application:preview.applicationEvent.minDuration")}
                value={formatDuration(applicationEvent.minDuration ?? "-")}
              />
              <StyledLabelValue
                label={t("application:preview.applicationEvent.maxDuration")}
                value={formatDuration(applicationEvent.maxDuration ?? "-")}
              />
              <StyledLabelValue
                label={t("application:preview.applicationEvent.eventsPerWeek")}
                value={applicationEvent.eventsPerWeek}
              />
              <div />
            </TwoColumnContainer>

            <FormSubHeading>
              {t("application:Page1.spacesSubHeading")}
            </FormSubHeading>
            <UnitList>
              {sortBy(applicationEvent.eventReservationUnits, "priority").map(
                (ru, index) => {
                  const resUnit = get(reservationUnits, [ru.reservationUnitId]);
                  return (
                    <UnitName key={ru.reservationUnitId}>
                      <div>{index + 1}</div>
                      <div>
                        {trim(
                          `${getOldReservationUnitName(
                            ru.reservationUnitDetails
                          )}${
                            resUnit &&
                            `, ${localizedValue(
                              get(resUnit, "unit.name"),
                              i18n.language
                            )}`
                          }`,
                          ","
                        )}
                      </div>
                    </UnitName>
                  );
                }
              )}
            </UnitList>
            <FormSubHeading>
              {t("application:preview.applicationEventSchedules")}
            </FormSubHeading>
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
      <FormSubHeading>{t("reservationUnit:termsOfUse")}</FormSubHeading>
      {tos1 && <Terms tabIndex={0}>{getTranslation(tos1, "text")}</Terms>}
      <FormSubHeading>
        {t("application:preview.reservationUnitTerms")}
      </FormSubHeading>
      {tos2 && <Terms tabIndex={0}>{getTranslation(tos2, "text")}</Terms>}
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
  );
};

export default Preview;
