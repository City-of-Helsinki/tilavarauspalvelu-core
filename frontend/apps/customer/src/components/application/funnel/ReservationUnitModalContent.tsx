import React from "react";
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
import { useTranslation } from "next-i18next";
import { useSearchParams } from "next/navigation";
import styled from "styled-components";
import { ButtonLikeLink } from "ui/src/components/ButtonLikeLink";
import Card from "ui/src/components/Card";
import { breakpoints } from "ui/src/modules/const";
import {
  filterNonNullable,
  getImageSource,
  getLocalizationLang,
  getTranslation,
  getMainImage,
} from "ui/src/modules/helpers";
import type { OptionsListT } from "ui/src/modules/search";
import { CenterSpinner, Flex, H3 } from "ui/src/styled";
import { type SearchFormValues, SeasonalSearchForm } from "@/components/SeasonalSearchForm";
import { useSearchQuery } from "@/hooks";
import { useSearchModify } from "@/hooks/useSearchValues";
import { processVariables } from "@/modules/search";
import { getReservationUnitPath } from "@/modules/urls";
import {
  type ApplicationReservationUnitListFragment,
  type Maybe,
  type RecurringCardFragment,
  ReservationKind,
} from "@gql/gql-types";

const ImageSizeWrapper = styled.div`
  @media (min-width: ${breakpoints.m}) {
    [class*="card__ImageWrapper"] {
      max-height: 140px !important;
    }
  }
`;

type ReservationUnitCardProps = Readonly<{
  reservationUnit: Omit<RecurringCardFragment, "currentAccessType" | "effectiveAccessType">;
  isSelected: boolean;
  handleAdd: (pk: Maybe<number>) => void;
  handleRemove: (pk: Maybe<number>) => void;
}>;

function ReservationUnitCard({ reservationUnit, handleAdd, handleRemove, isSelected }: ReservationUnitCardProps) {
  const { t, i18n } = useTranslation();
  const lang = getLocalizationLang(i18n.language);

  const toggleSelection = () => {
    if (isSelected) {
      handleRemove(reservationUnit.pk);
    } else {
      handleAdd(reservationUnit.pk);
    }
  };

  const buttonText = isSelected
    ? t("reservationUnitModal:deselectReservationUnit")
    : t("reservationUnitModal:selectReservationUnit");
  const name = getTranslation(reservationUnit, "name", lang);
  const reservationUnitTypeName = reservationUnit.reservationUnitType
    ? getTranslation(reservationUnit.reservationUnitType, "name", lang)
    : undefined;
  const unitName = getTranslation(reservationUnit.unit, "name", lang);

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
        testId="ModalContent__reservationUnitCard"
      />
    </ImageSizeWrapper>
  );
}

type AppRoundNode = Omit<ApplicationReservationUnitListFragment, "reservationUnits">;

export type ReservationUnitModalProps = Readonly<{
  applicationRound: AppRoundNode;
  handleAdd: (ru: Pick<RecurringCardFragment, "pk">) => void;
  handleRemove: (ru: Pick<RecurringCardFragment, "pk">) => void;
  currentReservationUnits: Pick<RecurringCardFragment, "pk">[];
  options: Pick<OptionsListT, "intendedUses" | "reservationUnitTypes" | "units">;
}>;

/// Does queries to get a list of reservation units based on user selected filters
/// search queries do not change query params (unlike other pages)
export function ReservationUnitModalContent({
  applicationRound,
  handleAdd,
  handleRemove,
  currentReservationUnits,
  options,
}: ReservationUnitModalProps): JSX.Element {
  const { t, i18n } = useTranslation();
  const lang = getLocalizationLang(i18n.language);

  const searchValues = useSearchParams();
  const variables = processVariables({
    values: searchValues,
    language: i18n.language,
    kind: ReservationKind.Season,
    applicationRound: applicationRound.pk ?? 0,
  });

  const query = useSearchQuery(variables);
  const { data, isLoading, error } = query;
  const { handleSearch } = useSearchModify();
  const onSearch = (criteria: SearchFormValues) => {
    handleSearch(criteria, true);
  };

  const reservationUnits = filterNonNullable(data?.reservationUnits?.edges.map((n) => n?.node));

  return (
    <Flex>
      <H3 as="p">{getTranslation(applicationRound, "name", lang)}</H3>
      <SeasonalSearchForm isLoading={isLoading} options={options} handleSearch={onSearch} />
      {isLoading ? (
        <CenterSpinner />
      ) : error ? (
        <div>{t("errors:search")}</div>
      ) : reservationUnits.length === 0 ? (
        <div>{t("common:noResults")}</div>
      ) : (
        reservationUnits.map((ru) => (
          <ReservationUnitCard
            handleAdd={(pk) => handleAdd({ pk })}
            handleRemove={(pk) => handleRemove({ pk })}
            isSelected={currentReservationUnits.some((i) => i.pk === ru.pk)}
            reservationUnit={ru}
            key={ru.pk}
          />
        ))
      )}
    </Flex>
  );
}
