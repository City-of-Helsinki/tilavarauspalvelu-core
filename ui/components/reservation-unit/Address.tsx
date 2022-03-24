import React from "react";
import { useTranslation } from "next-i18next";
import styled from "styled-components";
import { getTranslation } from "../../modules/util";
import ExternalLink from "./ExternalLink";
import {
  LocationType,
  ReservationUnitByPkType,
  UnitType,
} from "../../modules/gql-types";
import { H4 } from "../../modules/style/typography";

type Props = {
  reservationUnit: ReservationUnitByPkType;
};

const Container = styled.div`
  margin-top: var(--spacing-2-xs);
  margin-bottom: var(--spacing-layout-l);
`;

const Name = styled(H4)`
  margin-top: 0;
`;

const AddressLine = styled.div`
  font-family: var(--font-medium);
  font-weight: 500;
  font-size: var(--fontsize-body-m);
  margin-top: var(--spacing-2-xs);
`;

const Links = styled.div`
  margin-top: var(--spacing-m);
  font-family: var(--font-medium);
  font-weight: 500;

  a {
    color: var(--color-bus);
  }
`;

const hslUrl = (locale: string, location: LocationType): string | null => {
  if (!location) {
    return null;
  }

  return `https://www.reittiopas.fi/${locale}/?to=${encodeURI(
    `${getTranslation(location, "addressStreet")},${getTranslation(
      location,
      "addressCity"
    )}`
  )}`;
};

const googleUrl = (location: LocationType): string | null => {
  if (!location) {
    return null;
  }
  return `https://www.google.com/maps/dir/?api=1&destination=${getTranslation(
    location,
    "addressStreet"
  )},${getTranslation(location, "addressCity")}`;
};

const mapUrl = (unit: UnitType): string | null => {
  if (!unit?.tprekId) {
    return null;
  }

  return `https://palvelukartta.hel.fi/fi/unit/${unit.tprekId}`;
};

const Address = ({ reservationUnit }: Props): JSX.Element => {
  const { t, i18n } = useTranslation();

  const location = reservationUnit.unit?.location;
  const addressStreet = getTranslation(location, "addressStreet");
  const addressCity = getTranslation(location, "addressCity");

  if (!location || !addressStreet || !addressCity) {
    return <div />;
  }

  return (
    <Container data-testid="reservation-unit__address--container">
      <Name>{getTranslation(reservationUnit, "name")}</Name>
      {addressStreet && <AddressLine>{addressStreet}</AddressLine>}
      {location?.addressZip && addressCity && (
        <AddressLine>{`${location?.addressZip} ${addressCity}`}</AddressLine>
      )}
      <Links>
        <ExternalLink
          href={mapUrl(reservationUnit.unit)}
          name={t("reservationUnit:linkMap")}
        />
        <ExternalLink
          href={googleUrl(location)}
          name={t("reservationUnit:linkGoogle")}
        />
        <ExternalLink
          href={hslUrl(i18n.language, location)}
          name={t("reservationUnit:linkHSL")}
        />
      </Links>
    </Container>
  );
};

export default Address;
