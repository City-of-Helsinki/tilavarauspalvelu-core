import { useTranslation } from "next-i18next";
import { Accordion, ApplicationDatas } from "@/styled";
import { DataWrapper } from "./DataWrapper";
import React, { useState } from "react";
import {
  type ReservationPageFragment,
  useReservationDateOfBirthQuery,
  useReservationProfileDataContactInfoQuery,
  useReservationProfileDataSsnQuery,
} from "@gql/gql-types";
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
import { Flex, H5 } from "common/styled";
import styled from "styled-components";
import { useSession } from "@/hooks";
import { trim } from "lodash-es";
import { gql } from "@apollo/client";
import { formatDate } from "@/common/util";
import { getName as getCountryName, registerLocale as registerCountryLocale } from "i18n-iso-countries";
import countriesJson from "i18n-iso-countries/langs/fi.json";
import { getApiErrors } from "common/src/apolloUtils";
import { formatErrorMessage } from "common/src/hooks/useDisplayError";

registerCountryLocale(countriesJson);

const ReserveeDetailsAccordion = styled(Accordion)`
  div {
    row-gap: var(--spacing-s);
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
  reservation: ReservationPageFragment;
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

  const dateOfBirthNode = dateOfBirthData?.node != null && "user" in dateOfBirthData.node ? dateOfBirthData.node : null;

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
          type="alert"
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
            {formatDate(dateOfBirthNode?.user?.dateOfBirth) || "-"}
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

          <Flex $direction="row">
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
          </Flex>
        </>
      ) : null}
    </ReserveeDetailsAccordion>
  );
}

// NOTE separate query because all requests for dateOfBirth/profileData are logged,
// so don't make them automatically or inside other queries
export const RESERVATION_DATE_OF_BIRTH_QUERY = gql`
  query ReservationDateOfBirth($id: ID!) {
    node(id: $id) {
      ... on ReservationNode {
        id
        user {
          id
          pk
          dateOfBirth
        }
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
