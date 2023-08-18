import React from "react";
import { useTranslation } from "next-i18next";
import styled from "styled-components";
import { H4 } from "common/src/common/typography";
import {
  LocationType,
  ReservationUnitByPkType,
  ReservationUnitType,
  UnitType,
} from "common/types/gql-types";
import { IconLinkExternal } from "hds-react";
import { getTranslation } from "../../modules/util";
import IconButton from "../common/IconButton";

type Props = {
  reservationUnit: ReservationUnitByPkType | ReservationUnitType;
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

  a {
    color: var(--color-black-90);
  }
`;

const hslUrl = (locale: string, location: LocationType): string | null => {
  if (!location) {
    return null;
  }

  const addressStreet =
    getTranslation(location, "addressStreet") || location.addressStreetFi;
  const addressCity =
    getTranslation(location, "addressCity") || location.addressCityFi;

  const destination = addressStreet
    ? encodeURI(`${addressStreet},${addressCity}`)
    : "-";

  return `https://reittiopas.hsl.fi/reitti/-/${destination}/?locale=${locale}`;
};

const googleUrl = (locale: string, location: LocationType): string | null => {
  if (!location) {
    return null;
  }

  const addressStreet =
    getTranslation(location, "addressStreet") || location.addressStreetFi;
  const addressCity =
    getTranslation(location, "addressCity") || location.addressCityFi;

  const destination = addressStreet
    ? encodeURI(`${addressStreet},${addressCity}`)
    : "";

  return `https://www.google.com/maps/dir/?api=1&hl=${locale}&destination=${destination}`;
};

const mapUrl = (locale: string, unit: UnitType): string | null => {
  if (!unit?.tprekId) {
    return null;
  }

  return `https://palvelukartta.hel.fi/${locale}/unit/${unit.tprekId}`;
};

const accessibilityUrl = (locale: string, unit: UnitType): string | null => {
  if (!unit?.tprekId) {
    return null;
  }

  return `https://palvelukartta.hel.fi/${locale}/unit/${unit.tprekId}?p=1&t=accessibilityDetails`;
};

const Address = ({ reservationUnit }: Props): JSX.Element => {
  const { t, i18n } = useTranslation();

  const location = reservationUnit.unit?.location;
  const addressStreet =
    getTranslation(location, "addressStreet") || location.addressStreetFi;
  const addressCity =
    getTranslation(location, "addressCity") || location.addressCityFi;

  if (!location || !addressStreet || !addressCity) {
    return <div />;
  }

  return (
    <Container data-testid="reservation-unit__address--container">
      <Name>{getTranslation(reservationUnit, "name")}</Name>
      {addressStreet && <AddressSpan>{addressStreet}</AddressSpan>}
      {location?.addressZip && addressCity && (
        <AddressSpan>{`, ${location?.addressZip} ${addressCity}`}</AddressSpan>
      )}
      <Links>
        <IconButton
          href={mapUrl(i18n.language, reservationUnit.unit)}
          label={t("reservationUnit:linkMap")}
          icon={<IconLinkExternal aria-hidden />}
        />
        <IconButton
          href={googleUrl(i18n.language, location)}
          label={t("reservationUnit:linkGoogle")}
          icon={<IconLinkExternal aria-hidden />}
        />
        <IconButton
          href={hslUrl(i18n.language, location)}
          label={t("reservationUnit:linkHSL")}
          icon={<IconLinkExternal aria-hidden />}
        />
        <IconButton
          href={accessibilityUrl(i18n.language, reservationUnit.unit)}
          label={t("reservationUnit:linkAccessibility")}
          icon={<IconLinkExternal aria-hidden />}
        />
      </Links>
    </Container>
  );
};

export default Address;
