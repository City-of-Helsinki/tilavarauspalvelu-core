import {
  IconArrowRight,
  IconGroup,
  IconInfoCircle,
  IconLinkExternal,
  Button,
  ButtonVariant,
  ButtonSize,
  IconCross,
  IconSize,
} from "hds-react";
import React from "react";
import { useTranslation } from "next-i18next";
import styled from "styled-components";
import { H2, H3 } from "common/src/common/typography";
import { breakpoints } from "common/src/common/style";
import {
  ReservationUnitOrderingChoices,
  useSearchReservationUnitsQuery,
  type ReservationUnitCardFieldsFragment,
  type ApplicationReservationUnitListFragment,
  SearchReservationUnitsQueryVariables,
} from "@gql/gql-types";
import { filterNonNullable, getImageSource } from "common/src/helpers";
import { CenterSpinner, Flex } from "common/styles/util";
import { getMainImage } from "@/modules/util";
import { getApplicationRoundName } from "@/modules/applicationRound";
import { getReservationUnitName, getUnitName } from "@/modules/reservationUnit";
import { getReservationUnitPath } from "@/modules/urls";
import Card from "common/src/components/Card";
import { ButtonLikeLink } from "@/components/common/ButtonLikeLink";
import { type OptionTypes } from "./ReservationUnitList";
import {
  convertLanguageCode,
  getTranslationSafe,
} from "common/src/common/util";
import {
  SearchFormValues,
  SeasonalSearchForm,
} from "../recurring/SeasonalSearchForm";
import { transformAccessTypeSafe } from "common/src/conversion";

const ImageSizeWrapper = styled.div`
  @media (min-width: ${breakpoints.m}) {
    [class*="card__ImageWrapper"] {
      max-height: 140px !important;
    }
  }
`;

function ReservationUnitCard({
  reservationUnit,
  handleAdd,
  handleRemove,
  isSelected,
}: Readonly<{
  reservationUnit: ReservationUnitCardFieldsFragment;
  isSelected: boolean;
  handleAdd: (ru: ReservationUnitCardFieldsFragment) => void;
  handleRemove: (ru: ReservationUnitCardFieldsFragment) => void;
}>) {
  const { t, i18n } = useTranslation();
  const lang = convertLanguageCode(i18n.language);

  const toggleSelection = () => {
    if (isSelected) {
      handleRemove(reservationUnit);
    } else {
      handleAdd(reservationUnit);
    }
  };

  const buttonText = isSelected
    ? t("reservationUnitModal:unSelectReservationUnit")
    : t("reservationUnitModal:selectReservationUnit");
  const name = getReservationUnitName(reservationUnit);
  const reservationUnitTypeName = reservationUnit.reservationUnitType
    ? getTranslationSafe(reservationUnit.reservationUnitType, "name", lang)
    : undefined;
  const unitName = reservationUnit.unit
    ? getUnitName(reservationUnit.unit, lang)
    : undefined;

  const img = getMainImage(reservationUnit);
  const imgSrc = getImageSource(img, "small");
  const infos = [
    {
      icon: <IconInfoCircle />,
      value: reservationUnitTypeName ?? "",
    },
    {
      icon: <IconGroup />,
      value: reservationUnit.maxPersons?.toString() ?? "",
    },
  ];
  const buttons = [
    <ButtonLikeLink
      key="link"
      href={getReservationUnitPath(reservationUnit.pk)}
      target="_blank"
      rel="noopener noreferrer"
    >
      {t("reservationUnitModal:openLinkToNewTab")}
      <IconLinkExternal size={IconSize.ExtraSmall} />
    </ButtonLikeLink>,
    <Button
      key="toggle"
      iconEnd={isSelected ? <IconCross /> : <IconArrowRight />}
      onClick={toggleSelection}
      size={ButtonSize.Small}
      variant={isSelected ? ButtonVariant.Danger : ButtonVariant.Secondary}
    >
      {buttonText}
    </Button>,
  ];
  return (
    <ImageSizeWrapper>
      <Card
        heading={name ?? ""}
        imageSrc={imgSrc}
        text={unitName}
        infos={infos}
        buttons={buttons}
      />
    </ImageSizeWrapper>
  );
}

type AppRoundNode = Omit<
  ApplicationReservationUnitListFragment,
  "reservationUnits"
>;

export function ReservationUnitModalContent({
  applicationRound,
  handleAdd,
  handleRemove,
  currentReservationUnits,
  options,
}: Readonly<{
  applicationRound: AppRoundNode;
  handleAdd: (ru: ReservationUnitCardFieldsFragment) => void;
  handleRemove: (ru: ReservationUnitCardFieldsFragment) => void;
  currentReservationUnits: Pick<ReservationUnitCardFieldsFragment, "pk">[];
  options: Pick<
    OptionTypes,
    "purposeOptions" | "reservationUnitTypeOptions" | "unitOptions"
  >;
}>): JSX.Element {
  const { t, i18n } = useTranslation();
  const lang = convertLanguageCode(i18n.language);

  const baseVariables: SearchReservationUnitsQueryVariables = {
    applicationRound: [applicationRound.pk ?? 0],
    orderBy: [ReservationUnitOrderingChoices.NameFiAsc],
    isDraft: false,
    isVisible: true,
  };
  const { data, refetch, loading } = useSearchReservationUnitsQuery({
    skip: !applicationRound.pk,
    variables: baseVariables,
    notifyOnNetworkStatusChange: true,
  });

  const onSearch = (data: SearchFormValues) => {
    // TODO should update url query vars if possible since Tags come from the url query
    const variables: SearchReservationUnitsQueryVariables = {
      ...baseVariables,
      textSearch: data.textSearch,
      personsAllowed: data.personsAllowed,
      reservationUnitType: data.reservationUnitTypes,
      unit: data.units,
      purposes: data.purposes,
      accessType: data.accessTypes.map(transformAccessTypeSafe),
    };
    refetch(variables);
  };

  const reservationUnits = filterNonNullable(
    data?.reservationUnits?.edges.map((n) => n?.node)
  );

  return (
    <Flex>
      <H2 $noMargin>{t("reservationUnitModal:heading")}</H2>
      <H3 as="p">{getApplicationRoundName(applicationRound, lang)}</H3>
      <SeasonalSearchForm
        isLoading={loading}
        options={options}
        handleSearch={onSearch}
      />
      {loading ? (
        <CenterSpinner />
      ) : reservationUnits.length === 0 ? (
        <div>{t("common:noResults")}</div>
      ) : (
        reservationUnits.map((ru) => (
          <ReservationUnitCard
            handleAdd={() => handleAdd(ru)}
            handleRemove={() => handleRemove(ru)}
            isSelected={
              currentReservationUnits.find((i) => i.pk === ru.pk) !== undefined
            }
            reservationUnit={ru}
            key={ru.pk}
          />
        ))
      )}
    </Flex>
  );
}
