import React from "react";
import { useTranslation } from "next-i18next";
import styled from "styled-components";
import { fontMedium, H4 } from "common/src/common/typography";
import type {
  Maybe,
  LocationFieldsI18nFragment,
  UnitFieldsFragment,
} from "@gql/gql-types";
import { IconLinkExternal } from "hds-react";
import { IconButton } from "common/src/components";
import { mapUrlPrefix } from "@/modules/const";
import { Flex } from "common/styles/util";
import {
  convertLanguageCode,
  getTranslationSafe,
} from "common/src/common/util";
import { type LocalizationLanguages } from "common/src/helpers";

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

function createHslUrl(
  locale: LocalizationLanguages,
  location?: Maybe<LocationFieldsI18nFragment>
): UrlReturn {
  if (!location) {
    return "";
  }

  const addressStreet =
    getTranslationSafe(location, "addressStreet", locale) ||
    location.addressStreetFi;
  const addressCity =
    getTranslationSafe(location, "addressCity", locale) ||
    location.addressCityFi;

  const destination = addressStreet
    ? encodeURI(`${addressStreet},${addressCity}`)
    : "-";

  return `https://reittiopas.hsl.fi/reitti/-/${destination}/?locale=${locale}`;
}

function createGoogleUrl(
  locale: LocalizationLanguages,
  location?: Maybe<LocationFieldsI18nFragment>
): UrlReturn {
  if (!location) {
    return "";
  }

  const addressStreet =
    getTranslationSafe(location, "addressStreet", locale) ||
    location.addressStreetFi;
  const addressCity =
    getTranslationSafe(location, "addressCity", locale) ||
    location.addressCityFi;

  const destination = addressStreet
    ? encodeURI(`${addressStreet},${addressCity}`)
    : "";

  return `https://www.google.com/maps/dir/?api=1&hl=${locale}&destination=${destination}`;
}

function createMapUrl(
  locale: LocalizationLanguages,
  unit?: Maybe<Pick<UnitFieldsFragment, "tprekId">>
): string {
  if (!unit?.tprekId) {
    return "";
  }

  return `${mapUrlPrefix}${locale}/unit/${unit.tprekId}`;
}

function createAccessibilityUrl(
  locale: LocalizationLanguages,
  unit?: Maybe<Pick<UnitFieldsFragment, "tprekId">>
): UrlReturn {
  if (!unit?.tprekId) {
    return "";
  }

  return `https://palvelukartta.hel.fi/${locale}/unit/${unit.tprekId}?p=1&t=accessibilityDetails`;
}

type Props = {
  title: string;
  unit?: Maybe<UnitFieldsFragment> | undefined;
};

export function AddressSection({ title, unit }: Props): JSX.Element {
  const { t, i18n } = useTranslation();

  const { location } = unit ?? {};
  const lang = convertLanguageCode(i18n.language);

  const addressStreet =
    (location && getTranslationSafe(location, "addressStreet", lang)) ||
    location?.addressStreetFi;
  const addressCity =
    (location && getTranslationSafe(location, "addressCity", lang)) ||
    location?.addressCityFi;

  const unitMapUrl = createMapUrl(lang, unit);
  const googleUrl = createGoogleUrl(lang, location);
  const hslUrl = createHslUrl(lang, location);
  const accessibilityUrl = createAccessibilityUrl(lang, unit);

  return (
    <div data-testid="reservation-unit__address--container">
      <H4 as="h2">{title}</H4>
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
    </div>
  );
}
