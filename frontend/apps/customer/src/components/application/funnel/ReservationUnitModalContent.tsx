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
import {
  type ApplicationReservationUnitListFragment,
  type Maybe,
  type RecurringCardFragment,
  ReservationKind,
} from "@gql/gql-types";
import { filterNonNullable, getImageSource, getMainImage } from "ui/src/modules/helpers";
import { CenterSpinner, Flex, H3 } from "ui/src/styled";
import { breakpoints } from "ui/src/modules/const";
import Card from "ui/src/components/Card";
import { convertLanguageCode, getTranslationSafe } from "ui/src/modules/util";
import { getApplicationRoundName } from "@/modules/applicationRound";
import { getReservationUnitName, getUnitName } from "@/modules/reservationUnit";
import { getReservationUnitPath } from "@/modules/urls";
import { ButtonLikeLink } from "ui/src/components/ButtonLikeLink";
// TODO this is weird import path
import { SearchFormValues, SeasonalSearchForm } from "@/components/recurring/SeasonalSearchForm";
import { useSearchModify } from "@/hooks/useSearchValues";
import { processVariables } from "@/modules/search";
import { type OptionsListT } from "ui/src/modules/search";
import { useSearchParams } from "next/navigation";
import { useSearchQuery } from "@/hooks";

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
  const lang = convertLanguageCode(i18n.language);

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
  const name = getReservationUnitName(reservationUnit);
  const reservationUnitTypeName = reservationUnit.reservationUnitType
    ? getTranslationSafe(reservationUnit.reservationUnitType, "name", lang)
    : undefined;
  const unitName = reservationUnit.unit ? getUnitName(reservationUnit.unit, lang) : undefined;

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
  options: Pick<OptionsListT, "purposes" | "reservationUnitTypes" | "units">;
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
  const lang = convertLanguageCode(i18n.language);

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
      <H3 as="p">{getApplicationRoundName(applicationRound, lang)}</H3>
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
            isSelected={currentReservationUnits.find((i) => i.pk === ru.pk) !== undefined}
            reservationUnit={ru}
            key={ru.pk}
          />
        ))
      )}
    </Flex>
  );
}
