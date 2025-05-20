import { useTranslation } from "react-i18next";
import { Accordion, DataWrapper } from "@/spa/reservations/[id]/components";
import { ApplicationDatas } from "@/styled";
import React, { useState } from "react";
import {
  ReservationPageQuery,
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
import { useSession } from "@/hooks/auth";
import { trim } from "lodash-es";
import { gql } from "@apollo/client";
import { formatDate } from "@/common/util";
import {
  getName as getCountryName,
  registerLocale as registerCountryLocale,
} from "i18n-iso-countries";
import countriesJson from "i18n-iso-countries/langs/fi.json";
import { getApiErrors } from "common/src/apolloUtils";

registerCountryLocale(countriesJson);

type ReservationType = NonNullable<ReservationPageQuery["reservation"]>;

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
      style={{ cursor: isLoading ? "wait" : "" }}
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
    variables: { reservationId: Number(reservation.pk) },
    fetchPolicy: "no-cache",
    skip: !reservation.id || !isSSNVisible,
  });

  const [isContactInfoVisible, setIsContactInfoVisible] = useState(false);
  const {
    data: contactInfoData,
    loading: isContactInfoLoading,
    error: contactInfoError,
  } = useReservationProfileDataContactInfoQuery({
    variables: { reservationId: Number(reservation.pk) },
    fetchPolicy: "no-cache",
    skip: !reservation.id || !isContactInfoVisible,
  });
  const profileContactInfo = contactInfoData?.profileData;

  const gqlError = dateOfBirthError || ssnError || contactInfoError;
  const apiErrors = getApiErrors(gqlError);
  let errorMessage = String(gqlError?.message);
  if (apiErrors.length) {
    const apiErrorCode = apiErrors[0]?.code;
    if (apiErrorCode === "HELSINKI_PROFILE_PERMISSION_DENIED") {
      errorMessage = t("RequestedReservation.reserveePermissionError");
    } else if (
      apiErrorCode === "HELSINKI_PROFILE_KEYCLOAK_REFRESH_TOKEN_EXPIRED"
    ) {
      errorMessage = t("RequestedReservation.reserveeKeycloakExpiredError");
    }
  }

  return (
    <ReserveeDetailsAccordion
      id="reservation__reservee-details"
      heading={t("RequestedReservation.reserveeDetails")}
    >
      {gqlError && (
        <Notification
          type={"alert"}
          size={NotificationSize.Large}
          label={
            <H5 $noMargin>
              {t("RequestedReservation.reserveeUnableToShowData")}
            </H5>
          }
        >
          {errorMessage}
        </Notification>
      )}
      <ApplicationDatas>
        <DataWrapper
          label={t("RequestedReservation.reserveeFirstName")}
          isLoading={isContactInfoLoading}
        >
          {(isContactInfoVisible && !contactInfoError
            ? profileContactInfo?.firstName
            : reservation.user?.firstName) || "-"}
        </DataWrapper>
        <DataWrapper
          label={t("RequestedReservation.reserveeLastName")}
          isLoading={isContactInfoLoading}
        >
          {(isContactInfoVisible && !contactInfoError
            ? profileContactInfo?.lastName
            : reservation.user?.lastName) || "-"}
        </DataWrapper>

        <DataWrapper
          label={t("RequestedReservation.reserveeEmail")}
          isLoading={isContactInfoLoading}
        >
          {(isContactInfoVisible && !contactInfoError
            ? profileContactInfo?.email
            : reservation.user?.email) || "-"}
        </DataWrapper>
        <DataWrapper
          label={t("RequestedReservation.reserveeAuthenticationStrength")}
        >
          {t(
            reservation.user?.isStronglyAuthenticated
              ? "RequestedReservation.reserveeAuthenticationStrong"
              : "RequestedReservation.reserveeAuthenticationWeak"
          )}
        </DataWrapper>

        {isBirthDateVisible && (
          <DataWrapper
            label={t("RequestedReservation.birthDate")}
            isLoading={isDateOfBirthLoading}
          >
            {formatDate(dateOfBirthData?.reservation?.user?.dateOfBirth) || "-"}
          </DataWrapper>
        )}

        {isSSNVisible && (
          <DataWrapper
            label={t("RequestedReservation.reserveeSSN")}
            isLoading={isSSNLoading}
          >
            {ssnData?.profileData?.ssn || "-"}
          </DataWrapper>
        )}

        {isContactInfoVisible && (
          <>
            <DataWrapper
              label={t("RequestedReservation.reserveePhone")}
              isLoading={isContactInfoLoading}
            >
              {profileContactInfo?.phone || "-"}
            </DataWrapper>

            {!profileContactInfo?.countryCode ||
            profileContactInfo?.countryCode === "246" ? (
              <>
                {/* Local address */}
                <DataWrapper
                  label={t("RequestedReservation.addressCity")}
                  isLoading={isContactInfoLoading}
                >
                  {profileContactInfo?.municipalityName || "-"}
                </DataWrapper>
                <DataWrapper
                  label={t("RequestedReservation.addressStreet")}
                  isLoading={isContactInfoLoading}
                >
                  <span>{profileContactInfo?.streetAddress || "-"}</span>
                  <br />
                  <span>
                    {profileContactInfo?.postalCode || profileContactInfo?.city
                      ? trim(
                          `${profileContactInfo?.postalCode} ${profileContactInfo?.city}`
                        )
                      : ""}
                  </span>
                </DataWrapper>
              </>
            ) : (
              <>
                {/* Foreign address */}
                <DataWrapper
                  label={t("RequestedReservation.addressCountry")}
                  isLoading={isContactInfoLoading}
                >
                  {getCountryName(profileContactInfo?.countryCode, "fi") || "-"}
                </DataWrapper>
                <DataWrapper
                  label={t("RequestedReservation.addressForeign")}
                  isLoading={isContactInfoLoading}
                >
                  {profileContactInfo?.streetAddress || "-"}
                </DataWrapper>
                <DataWrapper
                  label={t("RequestedReservation.addressAdditional")}
                  isLoading={isContactInfoLoading}
                >
                  {profileContactInfo?.additionalAddress || "-"}
                </DataWrapper>
              </>
            )}
          </>
        )}
      </ApplicationDatas>

      {!reservation.user?.isAdAuthenticated ? (
        <>
          <Notification>
            {t("RequestedReservation.reserveeShowInfosNotification")}
          </Notification>

          <Flex $direction={"row"}>
            <ReserveeDetailsButton
              isLoading={isContactInfoLoading}
              onClick={() => {
                setIsContactInfoVisible(true);
              }}
              disabled={
                !!contactInfoData ||
                !currentUser?.isAdAuthenticated ||
                !!contactInfoError
              }
              icon={<IconEnvelope />}
              text={t("RequestedReservation.reserveeShowContactInfo")}
            />
            <ReserveeDetailsButton
              isLoading={isDateOfBirthLoading}
              onClick={() => {
                setIsBirthDateVisible(true);
              }}
              disabled={!!dateOfBirthData || !!dateOfBirthError}
              icon={<IconCake />}
              text={t("RequestedReservation.reserveeShowBirthDate")}
            />
            <ReserveeDetailsButton
              isLoading={isSSNLoading}
              onClick={() => {
                setIsSSNVisible(true);
              }}
              disabled={
                !!ssnData || !currentUser?.isAdAuthenticated || !!ssnError
              }
              icon={<IconPersonGenderless />}
              text={t("RequestedReservation.reserveeShowSSN")}
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
  query ReservationProfileDataContactInfo($reservationId: Int!) {
    profileData(reservationId: $reservationId) {
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
  query ReservationProfileDataSSN($reservationId: Int!) {
    profileData(reservationId: $reservationId) {
      ssn
    }
  }
`;
