import {
  IconArrowRight,
  IconGroup,
  IconInfoCircle,
  TextInput,
  Select,
  IconLinkExternal,
  Button,
  ButtonVariant,
  ButtonSize,
  LoadingSpinner,
  IconCross,
  IconSearch,
  IconSize,
} from "hds-react";
import React, { ChangeEvent, useState } from "react";
import { useTranslation } from "next-i18next";
import styled from "styled-components";
import { H2, H3 } from "common/src/common/typography";
import { breakpoints } from "common/src/common/style";
import {
  ReservationUnitOrderingChoices,
  useSearchReservationUnitsQuery,
  type ReservationUnitCardFieldsFragment,
  type ApplicationQuery,
} from "@gql/gql-types";
import {
  filterNonNullable,
  getImageSource,
  toNumber,
} from "common/src/helpers";
import { AutoGrid, Flex } from "common/styles/util";
import { getMainImage, getTranslation } from "@/modules/util";
import { getApplicationRoundName } from "@/modules/applicationRound";
import { getReservationUnitName, getUnitName } from "@/modules/reservationUnit";
import { getReservationUnitPath } from "@/modules/urls";
import { convertLanguageCode } from "common/src/common/util";
import Card from "common/src/components/Card";
import { ButtonLikeLink } from "@/components/common/ButtonLikeLink";

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
  reservationUnit: ReservationUnitType;
  isSelected: boolean;
  handleAdd: (ru: ReservationUnitType) => void;
  handleRemove: (ru: ReservationUnitType) => void;
}>) {
  const { t } = useTranslation();

  const handle = () =>
    isSelected ? handleRemove(reservationUnit) : handleAdd(reservationUnit);
  const buttonText = isSelected
    ? t("reservationUnitModal:unSelectReservationUnit")
    : t("reservationUnitModal:selectReservationUnit");
  const name = getReservationUnitName(reservationUnit);
  const reservationUnitTypeName = reservationUnit.reservationUnitType
    ? getTranslation(reservationUnit.reservationUnitType, "name")
    : undefined;
  const unitName = reservationUnit.unit
    ? getUnitName(reservationUnit.unit)
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
      style={{
        whiteSpace: "nowrap",
      }}
    >
      {t("reservationUnitModal:openLinkToNewTab")}
      <IconLinkExternal size={IconSize.ExtraSmall} />
    </ButtonLikeLink>,
    <Button
      key="toggle"
      iconEnd={
        isSelected ? (
          <IconCross aria-hidden="true" />
        ) : (
          <IconArrowRight aria-hidden="true" />
        )
      }
      onClick={handle}
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

type Node = NonNullable<ApplicationQuery["application"]>;
type AppRoundNode = NonNullable<Node["applicationRound"]>;
type ReservationUnitType = ReservationUnitCardFieldsFragment;
type OptionType = {
  label: string;
  value: number;
};
type OptionsType = {
  purposeOptions: OptionType[];
  reservationUnitTypeOptions: OptionType[];
  participantCountOptions: OptionType[];
  unitOptions: OptionType[];
};

const emptyOption = {
  label: "",
};

export function ReservationUnitModalContent({
  applicationRound,
  handleAdd,
  handleRemove,
  currentReservationUnits,
  options,
}: {
  applicationRound: AppRoundNode;
  handleAdd: (ru: ReservationUnitType) => void;
  handleRemove: (ru: ReservationUnitType) => void;
  currentReservationUnits: Pick<ReservationUnitType, "pk">[];
  options: OptionsType;
}): JSX.Element {
  const [searchTerm, setSearchTerm] = useState<string | undefined>(undefined);
  const [reservationUnitType, setReservationUnitType] = useState<
    number | undefined
  >(undefined);
  const [unit, setUnit] = useState<number | undefined>(undefined);
  const [maxPersons, setMaxPersons] = useState<number | undefined>(undefined);

  const reservationUnitTypeOptions = [emptyOption].concat(
    options.reservationUnitTypeOptions
  );

  const participantCountOptions = [emptyOption].concat(
    options.participantCountOptions
  );

  const unitOptions = [emptyOption].concat(options.unitOptions);

  const { t, i18n } = useTranslation();
  const language = convertLanguageCode(i18n.language);

  const { data, refetch, loading } = useSearchReservationUnitsQuery({
    skip: !applicationRound.pk,
    variables: {
      applicationRound: [applicationRound.pk ?? 0],
      textSearch: searchTerm,
      maxPersons: maxPersons?.toString(),
      reservationUnitType:
        reservationUnitType != null ? [reservationUnitType] : [],
      unit: unit != null ? [unit] : [],
      orderBy: [ReservationUnitOrderingChoices.NameFiAsc],
      isDraft: false,
      isVisible: true,
    },
    notifyOnNetworkStatusChange: true,
    fetchPolicy: "no-cache",
  });

  const reservationUnits = filterNonNullable(
    data?.reservationUnits?.edges.map((n) => n?.node)
  );

  return (
    <Flex>
      <H2 $noMargin>{t("reservationUnitModal:heading")}</H2>
      <H3 as="p">{getApplicationRoundName(applicationRound)}</H3>
      <AutoGrid $minWidth="14rem">
        <TextInput
          id="reservationUnitSearch.search"
          label={t("reservationUnitModal:searchTermLabel")}
          onChange={(e: ChangeEvent<HTMLInputElement>): void => {
            setSearchTerm(e.target.value);
          }}
        />
        <Select
          options={reservationUnitTypeOptions}
          texts={{
            label: t("reservationUnitModal:searchReservationUnitTypeLabel"),
            placeholder: t("common:select"),
            language,
          }}
          clearable
          onChange={(selection): void => {
            const val = selection.find((x) => x.selected)?.value;
            setReservationUnitType(toNumber(val) ?? undefined);
          }}
        />
        <Select
          clearable
          texts={{
            label: t("searchForm:participantCountLabel"),
            placeholder: t("common:select"),
            language,
          }}
          options={participantCountOptions}
          onChange={(selection): void => {
            const val = selection.find((x) => x.selected)?.value;
            setMaxPersons(toNumber(val) ?? undefined);
          }}
        />
        <Select
          clearable
          texts={{
            placeholder: t("common:select"),
            label: t("reservationUnitModal:searchUnitLabel"),
          }}
          options={unitOptions}
          onChange={(selection): void => {
            const val = selection.find((x) => x.selected)?.value;
            setUnit(toNumber(val) ?? undefined);
          }}
        />
      </AutoGrid>
      <Flex $alignItems="flex-end">
        <Button
          variant={loading ? ButtonVariant.Clear : ButtonVariant.Primary}
          iconStart={
            loading ? (
              <LoadingSpinner small />
            ) : (
              <IconSearch aria-hidden="true" />
            )
          }
          disabled={loading}
          onClick={(_) => refetch()}
        >
          {t("common:search")}
        </Button>
      </Flex>
      {reservationUnits.length === 0 && <div>{t("common:noResults")}</div>}
      {reservationUnits.map((ru) => (
        <ReservationUnitCard
          handleAdd={() => handleAdd(ru)}
          handleRemove={() => handleRemove(ru)}
          isSelected={
            currentReservationUnits.find((i) => i.pk === ru.pk) !== undefined
          }
          reservationUnit={ru}
          key={ru.pk}
        />
      ))}
    </Flex>
  );
}
