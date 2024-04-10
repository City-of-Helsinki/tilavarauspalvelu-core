import React from "react";
import { useTranslation } from "next-i18next";
import styled from "styled-components";
import { H4 } from "common/src/common/typography";
import type { LocationType, Maybe, UnitType } from "common/types/gql-types";
import { IconLinkExternal } from "hds-react";
import { IconButton } from "common/src/components";
import type { ReservationUnitNode } from "common";
import { getTranslation } from "../../modules/util";
import { mapUrlPrefix } from "@/modules/const";

type Props = {
  reservationUnit: ReservationUnitNode;
};

const Container = styled.div`
  margin-top: var(--spacing-2-xs);
  margin-bottom: var(--spacing-layout-l);
`;

const Name = styled(H4).attrs({ as: "h3" })``;

const AddressSpan = styled.span`
  font-size: var(--fontsize-body-l);
`;

const Links = styled.div`
  margin-top: var(--spacing-m);
  font-family: var(--font-medium);
  font-weight: 500;

  display: flex;
  flex-direction: column;

  /* IconButton includes too much padding */
  gap: var(--spacing-xs);
  && > * > * {
    margin: 0;
  }
`;

/// Common type for url constructors
/// Always returns a string, but can be empty => empty url is rendered as a disabled link
type UrlReturn = string;

function createHslUrl(
  locale: string,
  location?: Maybe<LocationType>
): UrlReturn {
  if (!location) {
    return "";
  }

  const addressStreet =
    getTranslation(location, "addressStreet") || location.addressStreetFi;
  const addressCity =
    getTranslation(location, "addressCity") || location.addressCityFi;

  const destination = addressStreet
    ? encodeURI(`${addressStreet},${addressCity}`)
    : "-";

  return `https://reittiopas.hsl.fi/reitti/-/${destination}/?locale=${locale}`;
}

function createGoogleUrl(
  locale: string,
  location?: Maybe<LocationType>
): UrlReturn {
  if (!location) {
    return "";
  }

  const addressStreet =
    getTranslation(location, "addressStreet") || location.addressStreetFi;
  const addressCity =
    getTranslation(location, "addressCity") || location.addressCityFi;

  const destination = addressStreet
    ? encodeURI(`${addressStreet},${addressCity}`)
    : "";

  return `https://www.google.com/maps/dir/?api=1&hl=${locale}&destination=${destination}`;
}

function createMapUrl(locale: string, unit?: Maybe<UnitType>): string {
  if (!unit?.tprekId) {
    return "";
  }

  return `${mapUrlPrefix}${locale}/unit/${unit.tprekId}`;
}

function createAccessibilityUrl(
  locale: string,
  unit?: Maybe<UnitType>
): UrlReturn {
  if (!unit?.tprekId) {
    return "";
  }

  return `https://palvelukartta.hel.fi/${locale}/unit/${unit.tprekId}?p=1&t=accessibilityDetails`;
}

export function AddressSection({ reservationUnit }: Props): JSX.Element {
  const { t, i18n } = useTranslation();

  const location = reservationUnit.unit?.location;
  const addressStreet =
    (location && getTranslation(location, "addressStreet")) ||
    location?.addressStreetFi;
  const addressCity =
    (location && getTranslation(location, "addressCity")) ||
    location?.addressCityFi;

  const unitMapUrl = createMapUrl(i18n.language, reservationUnit?.unit);
  const googleUrl = createGoogleUrl(i18n.language, location);
  const hslUrl = createHslUrl(i18n.language, location);
  const accessibilityUrl = createAccessibilityUrl(
    i18n.language,
    reservationUnit.unit
  );

  return (
    <Container data-testid="reservation-unit__address--container">
      <Name>{getTranslation(reservationUnit, "name")}</Name>
      {addressStreet && <AddressSpan>{addressStreet}</AddressSpan>}
      {location?.addressZip && addressCity && (
        <AddressSpan>{`, ${location?.addressZip} ${addressCity}`}</AddressSpan>
      )}
      <Links>
        <IconButton
          href={unitMapUrl}
          label={t("reservationUnit:linkMap")}
          icon={<IconLinkExternal aria-hidden />}
        />
        <IconButton
          href={googleUrl}
          label={t("reservationUnit:linkGoogle")}
          icon={<IconLinkExternal aria-hidden />}
        />
        <IconButton
          href={hslUrl}
          label={t("reservationUnit:linkHSL")}
          icon={<IconLinkExternal aria-hidden />}
        />
        <IconButton
          href={accessibilityUrl}
          label={t("reservationUnit:linkAccessibility")}
          icon={<IconLinkExternal aria-hidden />}
        />
      </Links>
    </Container>
  );
}
