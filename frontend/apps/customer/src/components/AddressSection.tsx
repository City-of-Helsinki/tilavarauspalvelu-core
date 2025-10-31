import React from "react";
import { gql } from "@apollo/client";
import { IconLinkExternal } from "hds-react";
import { useTranslation } from "next-i18next";
import styled from "styled-components";
import { IconButton } from "ui/src/components";
import { type LocalizationLanguages } from "ui/src/modules/urlBuilder";
import { getTranslation } from "ui/src/modules/util";
import { Flex, H4, fontMedium } from "ui/src/styled";
import { getLocalizationLang } from "@ui/modules/helpers";
import { mapUrlPrefix } from "@/modules/const";
import type { Maybe, LocationFieldsI18nFragment, AddressFieldsFragment } from "@gql/gql-types";

const AddressSpan = styled.span`
  font-size: var(--fontsize-body-l);
`;

const Links = styled(Flex).attrs({
  $gap: "xs",
  $marginTop: "m",
})`
  ${fontMedium}

  /* IconButton includes too much padding */
  && > * > * {
    margin: 0;
  }
`;

/// Common type for url constructors
/// Always returns a string, but can be empty => empty url is rendered as a disabled link
type UrlReturn = string;

export function createHslUrl(
  locale: LocalizationLanguages,
  location: Maybe<LocationFieldsI18nFragment> | undefined
): UrlReturn {
  if (!location?.addressStreetFi || !location?.addressCityFi) {
    return "";
  }

  const addressStreet = getTranslation(location, "addressStreet", locale);
  const addressCity = getTranslation(location, "addressCity", locale);
  if (addressStreet === "" || addressCity === "") {
    return "";
  }

  const destination = addressStreet ? encodeURI(`${addressStreet},${addressCity}`) : "-";

  return `https://reittiopas.hsl.fi/reitti/-/${destination}/?locale=${locale}`;
}

export function createGoogleUrl(
  locale: LocalizationLanguages,
  location: Maybe<LocationFieldsI18nFragment> | undefined
): UrlReturn {
  if (!location?.addressStreetFi || !location?.addressCityFi) {
    return "";
  }

  const addressStreet = getTranslation(location, "addressStreet", locale);
  const addressCity = getTranslation(location, "addressCity", locale);
  if (addressStreet === "" || addressCity === "") {
    return "";
  }

  const destination = addressStreet ? encodeURI(`${addressStreet},${addressCity}`) : "";

  return `https://www.google.com/maps/dir/?api=1&hl=${locale}&destination=${destination}`;
}

export function createMapUrl(
  locale: LocalizationLanguages,
  unit: Maybe<Pick<AddressFieldsFragment, "tprekId">> | undefined
): string {
  if (!unit?.tprekId) {
    return "";
  }

  return `${mapUrlPrefix}${locale}/unit/${unit.tprekId}`;
}

export function createAccessibilityUrl(
  locale: LocalizationLanguages,
  unit: Maybe<Pick<AddressFieldsFragment, "tprekId">> | undefined
): UrlReturn {
  if (!unit?.tprekId) {
    return "";
  }

  return `https://palvelukartta.hel.fi/${locale}/unit/${unit.tprekId}?p=1&t=accessibilityDetails`;
}

type Props = {
  title: string;
  unit: Maybe<AddressFieldsFragment> | undefined;
};

export function AddressSection({ title, unit }: Props): React.ReactElement | null {
  const { t, i18n } = useTranslation();

  const lang = getLocalizationLang(i18n.language);

  const addressStreet = unit ? getTranslation(unit, "addressStreet", lang) : undefined;
  const addressCity = unit ? getTranslation(unit, "addressCity", lang) : undefined;

  const unitMapUrl = createMapUrl(lang, unit);
  const googleUrl = createGoogleUrl(lang, unit);
  const hslUrl = createHslUrl(lang, unit);
  const accessibilityUrl = createAccessibilityUrl(lang, unit);

  return (
    <div data-testid="reservation-unit__address--container">
      <H4 as="h2">{title}</H4>
      {addressStreet && <AddressSpan>{addressStreet}</AddressSpan>}
      {unit?.addressZip && addressCity && <AddressSpan>{`, ${unit?.addressZip} ${addressCity}`}</AddressSpan>}
      <Links>
        {unitMapUrl !== "" && (
          <IconButton
            href={unitMapUrl}
            label={t("reservationUnit:linkMap")}
            icon={<IconLinkExternal aria-hidden="true" />}
          />
        )}
        {googleUrl !== "" && (
          <IconButton
            href={googleUrl}
            label={t("reservationUnit:linkGoogle")}
            icon={<IconLinkExternal aria-hidden="true" />}
          />
        )}
        {hslUrl !== "" && (
          <IconButton
            href={hslUrl}
            label={t("reservationUnit:linkHSL")}
            icon={<IconLinkExternal aria-hidden="true" />}
          />
        )}
        {accessibilityUrl !== "" && (
          <IconButton
            href={accessibilityUrl}
            label={t("reservationUnit:linkAccessibility")}
            icon={<IconLinkExternal aria-hidden="true" />}
          />
        )}
      </Links>
    </div>
  );
}

export const ADDRESS_FIELDS = gql`
  fragment AddressFields on UnitNode {
    id
    pk
    tprekId
    ...LocationFieldsI18n
  }
`;
