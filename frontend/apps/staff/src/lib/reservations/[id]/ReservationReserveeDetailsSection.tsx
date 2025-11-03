import React, { useState } from "react";
import { gql } from "@apollo/client";
import {
  Button,
  ButtonVariant,
  IconCake,
  IconEnvelope,
  IconPersonGenderless,
  LoadingSpinner,
  Notification,
  NotificationSize,
} from "hds-react";
import { getName as getCountryName, registerLocale as registerCountryLocale } from "i18n-iso-countries";
import countriesJson from "i18n-iso-countries/langs/fi.json";
import { trim } from "lodash-es";
import { useTranslation } from "next-i18next";
import styled from "styled-components";
import { formatErrorMessage } from "ui/src/hooks/useDisplayError";
import { getApiErrors } from "ui/src/modules/apolloUtils";
import { formatDate, parseValidDateObject } from "ui/src/modules/date-utils";
import { H5 } from "ui/src/styled";
import { breakpoints } from "@ui/modules/const";
import { useSession } from "@/hooks";
import { Accordion, ApplicationDatas } from "@/styled";
import {
  ReservationPageQuery,
  useReservationDateOfBirthQuery,
  useReservationProfileDataContactInfoQuery,
  useReservationProfileDataSsnQuery,
} from "@gql/gql-types";
import { DataWrapper } from "./DataWrapper";

registerCountryLocale(countriesJson);

type ReservationType = NonNullable<ReservationPageQuery["reservation"]>;

const ReserveeDetailsAccordion = styled(Accordion)`
  div {
    row-gap: var(--spacing-s);
  }
`;

const ReserveeButtonContainer = styled.div`
  display: flex;
  flex-direction: row;
  gap: var(--spacing-s);
  @media (max-width: ${breakpoints.s}) {
    flex-direction: column;
    gap: var(--spacing-xs);
  }
`;

function ReserveeDetailsButton({
  isLoading,
  onClick,
  disabled,
  icon,
  text,
}: {
  isLoading: boolean;
  onClick: () => void;
  disabled: boolean;
  icon: React.ReactNode;
  text: string;
}) {
  return (
    <Button
      variant={ButtonVariant.Secondary}
      iconStart={isLoading ? <LoadingSpinner small /> : icon}
      style={{ cursor: isLoading ? "wait" : undefined }}
      onClick={onClick}
      disabled={disabled}
    >
      {text}
    </Button>
  );
}

export function ReservationReserveeDetailsSection({
  reservation,
}: Readonly<{
  reservation: ReservationType;
}>) {
  const { t } = useTranslation();
  const { user: currentUser } = useSession();

  const [isBirthDateVisible, setIsBirthDateVisible] = useState(false);
  const {
    data: dateOfBirthData,
    loading: isDateOfBirthLoading,
    error: dateOfBirthError,
  } = useReservationDateOfBirthQuery({
    variables: { id: reservation.id },
    fetchPolicy: "no-cache",
    skip: !reservation.id || !isBirthDateVisible,
  });

  const [isSSNVisible, setIsSSNVisible] = useState(false);
  const {
    data: ssnData,
    loading: isSSNLoading,
    error: ssnError,
  } = useReservationProfileDataSsnQuery({
    variables: { reservationPk: reservation.pk ?? 0 },
    fetchPolicy: "no-cache",
    skip: !reservation.id || !isSSNVisible,
  });

  const [isContactInfoVisible, setIsContactInfoVisible] = useState(false);
  const {
    data: contactInfoData,
    loading: isContactInfoLoading,
    error: contactInfoError,
  } = useReservationProfileDataContactInfoQuery({
    variables: { reservationPk: reservation.pk ?? 0 },
    fetchPolicy: "no-cache",
    skip: !reservation.id || !isContactInfoVisible,
  });
  const profileContactInfo = contactInfoData?.profileData;

  const gqlError = dateOfBirthError || ssnError || contactInfoError;
  const apiErrors = getApiErrors(gqlError);
  let errorMessage = "";
  if (apiErrors.length > 0) {
    const formatedErrors = apiErrors.map((e) => formatErrorMessage(t, e));
    errorMessage = formatedErrors.join(", ");
  }

  return (
    <ReserveeDetailsAccordion id="reservation__reservee-details" heading={t("reservation:reserveeDetails")}>
      {gqlError && (
        <Notification
          type={"alert"}
          size={NotificationSize.Large}
          label={<H5 $noMargin>{t("reservation:reserveeUnableToShowData")}</H5>}
        >
          {errorMessage}
        </Notification>
      )}
      <ApplicationDatas>
        <DataWrapper label={t("reservation:reserveeFirstName")} isLoading={isContactInfoLoading}>
          {(isContactInfoVisible && !contactInfoError ? profileContactInfo?.firstName : reservation.user?.firstName) ||
            "-"}
        </DataWrapper>
        <DataWrapper label={t("reservation:reserveeLastName")} isLoading={isContactInfoLoading}>
          {(isContactInfoVisible && !contactInfoError ? profileContactInfo?.lastName : reservation.user?.lastName) ||
            "-"}
        </DataWrapper>

        <DataWrapper label={t("reservation:reserveeEmail")} isLoading={isContactInfoLoading}>
          {(isContactInfoVisible && !contactInfoError ? profileContactInfo?.email : reservation.user?.email) || "-"}
        </DataWrapper>
        <DataWrapper label={t("reservation:reserveeAuthenticationStrength")}>
          {t(
            reservation.user?.isStronglyAuthenticated
              ? "reservation:reserveeAuthenticationStrong"
              : "reservation:reserveeAuthenticationWeak"
          )}
        </DataWrapper>

        {isBirthDateVisible && (
          <DataWrapper label={t("reservation:birthDate")} isLoading={isDateOfBirthLoading}>
            {dateOfBirthData?.reservation?.user?.dateOfBirth
              ? formatDate(parseValidDateObject(dateOfBirthData?.reservation?.user?.dateOfBirth))
              : "-"}
          </DataWrapper>
        )}

        {isSSNVisible && (
          <DataWrapper label={t("reservation:reserveeSSN")} isLoading={isSSNLoading}>
            {ssnData?.profileData?.ssn || "-"}
          </DataWrapper>
        )}

        {isContactInfoVisible && (
          <>
            <DataWrapper label={t("reservation:reserveePhone")} isLoading={isContactInfoLoading}>
              {profileContactInfo?.phone || "-"}
            </DataWrapper>

            {!profileContactInfo?.countryCode || profileContactInfo?.countryCode === "246" ? (
              <>
                {/* Local address */}
                <DataWrapper label={t("reservation:addressCity")} isLoading={isContactInfoLoading}>
                  {profileContactInfo?.municipalityName || "-"}
                </DataWrapper>
                <DataWrapper label={t("reservation:addressStreet")} isLoading={isContactInfoLoading}>
                  <span>{profileContactInfo?.streetAddress || "-"}</span>
                  <br />
                  <span>
                    {profileContactInfo?.postalCode || profileContactInfo?.city
                      ? trim(`${profileContactInfo?.postalCode} ${profileContactInfo?.city}`)
                      : ""}
                  </span>
                </DataWrapper>
              </>
            ) : (
              <>
                {/* Foreign address */}
                <DataWrapper label={t("reservation:addressCountry")} isLoading={isContactInfoLoading}>
                  {getCountryName(profileContactInfo?.countryCode, "fi") || "-"}
                </DataWrapper>
                <DataWrapper label={t("reservation:addressForeign")} isLoading={isContactInfoLoading}>
                  {profileContactInfo?.streetAddress || "-"}
                </DataWrapper>
                <DataWrapper label={t("reservation:addressAdditional")} isLoading={isContactInfoLoading}>
                  {profileContactInfo?.additionalAddress || "-"}
                </DataWrapper>
              </>
            )}
          </>
        )}
      </ApplicationDatas>

      {!reservation.user?.isAdAuthenticated ? (
        <>
          <Notification>{t("reservation:reserveeShowInfosNotification")}</Notification>

          <ReserveeButtonContainer>
            <ReserveeDetailsButton
              isLoading={isContactInfoLoading}
              onClick={() => {
                setIsContactInfoVisible(true);
              }}
              disabled={!!contactInfoData || !currentUser?.isAdAuthenticated || !!contactInfoError}
              icon={<IconEnvelope />}
              text={t("reservation:reserveeShowContactInfo")}
            />
            <ReserveeDetailsButton
              isLoading={isDateOfBirthLoading}
              onClick={() => {
                setIsBirthDateVisible(true);
              }}
              disabled={!!dateOfBirthData || !!dateOfBirthError}
              icon={<IconCake />}
              text={t("reservation:reserveeShowBirthDate")}
            />
            <ReserveeDetailsButton
              isLoading={isSSNLoading}
              onClick={() => {
                setIsSSNVisible(true);
              }}
              disabled={!!ssnData || !currentUser?.isAdAuthenticated || !!ssnError}
              icon={<IconPersonGenderless />}
              text={t("reservation:reserveeShowSSN")}
            />
          </ReserveeButtonContainer>
        </>
      ) : null}
    </ReserveeDetailsAccordion>
  );
}

// NOTE separate query because all requests for dateOfBirth/profileData are logged,
// so don't make them automatically or inside other queries
export const RESERVATION_DATE_OF_BIRTH_QUERY = gql`
  query ReservationDateOfBirth($id: ID!) {
    reservation(id: $id) {
      id
      user {
        id
        pk
        dateOfBirth
      }
    }
  }
`;

export const RESERVATION_PROFILE_DATA_CONTACT_INFO_QUERY = gql`
  query ReservationProfileDataContactInfo($reservationPk: Int!) {
    profileData(reservationPk: $reservationPk) {
      pk
      firstName
      lastName
      email
      phone
      municipalityCode
      municipalityName
      streetAddress
      postalCode
      city
      countryCode
      additionalAddress
    }
  }
`;

export const RESERVATION_PROFILE_DATA_SSN_QUERY = gql`
  query ReservationProfileDataSSN($reservationPk: Int!) {
    profileData(reservationPk: $reservationPk) {
      ssn
    }
  }
`;
