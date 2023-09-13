import React, { useEffect, useState } from "react";
import { Checkbox, Notification } from "hds-react";
import { useTranslation } from "next-i18next";
import { useQuery } from "@apollo/client";
import { sortBy, trim } from "lodash";
import { useRouter } from "next/router";
import styled from "styled-components";
import { formatDuration } from "common/src/common/util";
import {
  Application,
  Parameter,
  StringParameter,
  OptionType,
} from "common/types/common";
import { fontRegular } from "common/src/common/typography";
import { breakpoints } from "common/src/common/style";
import { Query, TermsOfUseType } from "common/types/gql-types";
import { getTranslation, mapOptions } from "../../modules/util";
import { getParameters } from "../../modules/api";
import LabelValue from "../common/LabelValue";
import TimePreview from "../common/TimePreview";
import ApplicantInfoPreview from "./ApplicantInfoPreview";
import {
  ButtonContainer,
  FormSubHeading,
  TwoColumnContainer,
} from "../common/common";
import { AccordionWithState as Accordion } from "../common/Accordion";
import { BlackButton } from "../../styles/util";
import { CITIES, RESERVATION_PURPOSES } from "../../modules/queries/params";
import { getOldReservationUnitName } from "../../modules/reservationUnit";

type Props = {
  application: Application;
  tos: TermsOfUseType[];
};

const mapArrayById = (
  array: { id: number }[]
): { [key: number]: { id: number } } => {
  return array.reduce((prev, current) => {
    // eslint-disable-next-line no-param-reassign
    prev[current.id] = current;
    return prev;
  }, {});
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

// Page specific hook so we don't make extra REST calls
const useViewHook = (application: Application) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isFetched, setIsFetched] = useState(false);

  const [ageGroupOptions, setAgeGroupOptions] = useState<{
    [key: number]: Parameter;
  }>({});

  useEffect(() => {
    async function fetchData() {
      const fetchedAgeGroupOptions = await getParameters("age_group");
      setAgeGroupOptions(mapArrayById(fetchedAgeGroupOptions));
      setIsLoading(false);
      setIsFetched(true);
    }

    if (!isLoading && !isFetched) {
      setIsLoading(true);
      fetchData();
    }
  }, [isLoading, isFetched, application, ageGroupOptions]);

  return {
    isLoading: isLoading || !isFetched,
    ageGroupOptions,
  };
};

const ViewApplication = ({ application, tos }: Props): JSX.Element | null => {
  const { t, i18n } = useTranslation();

  const [purposeOptions, setPurposeOptions] = useState<OptionType[]>([]);
  const [citiesOptions, setCitiesOptions] = useState<OptionType[]>([]);

  const [acceptTermsOfUse, setAcceptTermsOfUse] = useState(false);
  const router = useRouter();

  useQuery<Query>(RESERVATION_PURPOSES, {
    onCompleted: (res) => {
      const purposes = res?.reservationPurposes?.edges?.map(({ node }) => ({
        id: String(node.pk),
        name: getTranslation(node, "name"),
      }));
      setPurposeOptions(
        mapOptions(sortBy(purposes, "name") as StringParameter[])
      );
    },
  });

  useQuery<Query>(CITIES, {
    onCompleted: (res) => {
      const cities = res?.cities?.edges?.map(({ node }) => ({
        id: String(node.pk),
        name: getTranslation(node, "name"),
      }));
      setCitiesOptions(mapOptions(sortBy(cities, "id") as StringParameter[]));
    },
  });

  const tos1 = tos.find((n) => n.pk === "generic1");
  const tos2 = tos.find((n) => n.pk === "KUVAnupa");

  const { isLoading, ageGroupOptions } = useViewHook(application);

  if (isLoading) {
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
              <StyledLabelValue
                label={t("application:preview.applicationEvent.purpose")}
                value={
                  applicationEvent.purposeId
                    ? purposeOptions.find(
                        (n) => n.value === applicationEvent.purposeId.toString()
                      )?.label
                    : ""
                }
              />
              <StyledLabelValue
                label={t("application:preview.applicationEvent.begin")}
                value={applicationEvent.begin}
              />
              <StyledLabelValue
                label={t("application:preview.applicationEvent.end")}
                value={applicationEvent.end}
              />
              <StyledLabelValue
                label={t("application:preview.applicationEvent.minDuration")}
                value={formatDuration(applicationEvent.minDuration)}
              />
              <StyledLabelValue
                label={t("application:preview.applicationEvent.maxDuration")}
                value={formatDuration(applicationEvent.maxDuration)}
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
                (reservationUnit, index) => (
                  <UnitName key={reservationUnit.reservationUnitId}>
                    <div>{index + 1}</div>
                    <div>
                      {trim(
                        `${getOldReservationUnitName(
                          reservationUnit.reservationUnitDetails,
                          i18n.language
                        )}`
                      )}
                    </div>
                  </UnitName>
                )
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
      <Terms tabIndex={0}>{getTranslation(tos1, "text")}</Terms>
      <FormSubHeading>
        {t("application:preview.reservationUnitTerms")}
      </FormSubHeading>
      <Terms tabIndex={0}>{getTranslation(tos2, "text")}</Terms>
      <CheckboxContainer>
        <Checkbox
          id="preview.acceptTermsOfUse"
          checked={acceptTermsOfUse}
          onChange={(e) => setAcceptTermsOfUse(e.target.checked)}
          label={t("application:preview.userAcceptsTerms")}
          disabled
        />
      </CheckboxContainer>
      <StyledNotification
        label={t("application:preview.notification.processing")}
      >
        {t("application:preview.notification.body")}
      </StyledNotification>
      <ButtonContainer>
        <BlackButton variant="secondary" onClick={() => router.back()}>
          {t("common:prev")}
        </BlackButton>
      </ButtonContainer>
    </>
  );
};

export default ViewApplication;
