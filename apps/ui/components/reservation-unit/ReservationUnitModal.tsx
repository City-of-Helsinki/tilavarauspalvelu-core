import {
  IconArrowRight,
  IconGroup,
  IconInfoCircle,
  IconLocation,
  TextInput,
  Select,
  LoadingSpinner,
  IconLinkExternal,
} from "hds-react";
import React, { ChangeEvent, useState } from "react";
import Link from "next/link";
import { useTranslation } from "next-i18next";
import { useQuery } from "@apollo/client";
import styled from "styled-components";
import { OptionType } from "common/types/common";
import { fontMedium } from "common/src/common/typography";
import { breakpoints } from "common/src/common/style";
import {
  ApplicationRoundType,
  Query,
  QueryReservationUnitsArgs,
  ReservationUnitType,
} from "common/types/gql-types";
import { reservationUnitPath } from "@/modules/const";
import { getAddressAlt, getMainImage, getTranslation } from "@/modules/util";
import { MediumButton, pixel } from "@/styles/util";
import { RESERVATION_UNITS } from "@/modules/queries/reservationUnit";
import { getApplicationRoundName } from "@/modules/applicationRound";
import { getReservationUnitName, getUnitName } from "@/modules/reservationUnit";
import IconWithText from "../common/IconWithText";

const Container = styled.div`
  width: 100%;
  display: grid;
  margin-top: var(--spacing-l);
  gap: var(--spacing-m);
  align-items: start;

  @media (max-width: ${breakpoints.l}) {
    grid-template-areas:
      "image name"
      "image a"
      "props props";
    grid-template-columns: 180px auto;
  }

  @media (max-width: ${breakpoints.m}) {
    grid-template-areas:
      "image"
      "name"
      "props"
      "a";
    grid-template-columns: auto;
  }

  grid-template:
    "image name a"
    "image props props";
  grid-template-columns: 180px auto 230px;
`;

const Actions = styled.div`
  display: flex;
`;

const Name = styled.span`
  font-family: var(--font-bold);
  font-size: var(--fontsize-heading-m);
  font-weight: bold;

  a {
    text-decoration: none;
    color: var(--color-black-90);
  }
`;

const Unit = styled.div`
  margin-top: var(--spacing-2-xs);
`;

const Main = styled.span`
  grid-area: name;
`;

const Props = styled.span`
  font-size: var(--fontsize-body-m);
  grid-area: props;
  display: flex;
  align-items: center;

  svg {
    margin-right: var(--spacing-xs);
  }

  span:not(:first-child) {
    margin-right: var(--spacing-layout-m);
  }

  @media (max-width: ${breakpoints.m}) {
    flex-direction: column;
    align-items: flex-start;

    span:not(:first-child) {
      margin-right: 0;
    }
  }
`;

const Image = styled.img`
  grid-area: image;
  width: 178px;
  height: 185px;
`;

const LinkContent = styled.span`
  margin-top: var(--spacing-xs);
  display: flex;
  flex-direction: row;
  align-items: middle;
  font-family: var(--font-bold);
  font-size: var(--fontsize-body-m);
`;

const LinkText = styled.span`
  margin-left: var(--spacing-xs);
`;

const ReservationUnitCard = ({
  reservationUnit,
  handleAdd,
  handleRemove,
  isSelected,
}: {
  reservationUnit: ReservationUnitType;
  isSelected: boolean;
  handleAdd: (ru: ReservationUnitType) => void;
  handleRemove: (ru: ReservationUnitType) => void;
}) => {
  const { t } = useTranslation();

  const handle = () =>
    isSelected ? handleRemove(reservationUnit) : handleAdd(reservationUnit);
  const buttonText = isSelected
    ? t("reservationUnitModal:unSelectReservationUnit")
    : t("reservationUnitModal:selectReservationUnit");
  const reservationUnitName = getReservationUnitName(reservationUnit);
  const reservationUnitTypeName = reservationUnit.reservationUnitType
    ? getTranslation(reservationUnit.reservationUnitType, "name")
    : undefined;
  const unitName = reservationUnit.unit
    ? getUnitName(reservationUnit.unit)
    : undefined;

  return (
    <Container>
      <Image
        alt={reservationUnitName}
        src={getMainImage(reservationUnit)?.smallUrl || pixel}
      />
      <Main>
        <Name>{reservationUnitName}</Name>
        <Unit>{unitName}</Unit>
        <Link
          // TODO link should be disabled if no pk
          href={reservationUnitPath(reservationUnit.pk ?? 0)}
          target="_blank"
          rel="noopener noreferrer"
        >
          <LinkContent>
            <IconLinkExternal />
            <LinkText>{t("reservationUnitModal:openLinkToNewTab")}</LinkText>
          </LinkContent>
        </Link>
      </Main>
      <Props>
        {reservationUnitTypeName && (
          <IconWithText
            icon={<IconInfoCircle />}
            text={reservationUnitTypeName}
          />
        )}
        {reservationUnit.maxPersons && (
          <IconWithText
            icon={<IconGroup />}
            text={`${reservationUnit.maxPersons}`}
          />
        )}
        {getAddressAlt(reservationUnit) && (
          <IconWithText
            icon={<IconLocation />}
            text={getAddressAlt(reservationUnit) || ""}
          />
        )}
      </Props>
      <Actions>
        <MediumButton
          iconRight={<IconArrowRight />}
          onClick={handle}
          variant={isSelected ? "danger" : "secondary"}
        >
          {buttonText}
        </MediumButton>
      </Actions>
    </Container>
  );
};

const MainContainer = styled.div`
  overflow-y: auto;
  width: 48em;
  height: 40em;

  @media (max-width: ${breakpoints.s}) {
    margin: 0;
    padding: var(--spacing-xs);
    width: calc(100% - 2 * var(--spacing-xs));
    height: 100%;
  }
`;

const Heading = styled.div`
  font-family: var(--font-bold);
  font-size: var(--fontsize-heading-l);
`;

const Text = styled.span`
  font-family: var(--font-bold);
  font-size: var(--fontsize-heading-s);
`;

const Filters = styled.div`
  @media (max-width: ${breakpoints.m}) {
    grid-template-columns: 1fr;
    margin-left: 0;
  }

  margin-top: var(--spacing-m);
  margin-left: 5px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-m);

  label {
    ${fontMedium}
  }
`;

const ButtonContainer = styled.div`
  margin-top: var(--spacing-m);
  margin-left: 5px;
  display: flex;
  align-items: center;
`;

const SearchButton = styled(MediumButton).attrs({
  type: "submit",
})`
  margin-right: var(--spacing-m);
`;

const Ruler = styled.hr`
  margin-top: var(--spacing-layout-m);
`;

const Results = styled.div`
  margin-bottom: 112px;
  width: 99%;
`;

const StyledLoadingSpinner = styled(LoadingSpinner).attrs({ small: true })``;

type OptionsType = {
  purposeOptions: OptionType[];
  reservationUnitTypeOptions: OptionType[];
  participantCountOptions: OptionType[];
  unitOptions: OptionType[];
};

const emptyOption = {
  label: "",
};

const ReservationUnitModal = ({
  applicationRound,
  handleAdd,
  handleRemove,
  currentReservationUnits,
  options,
}: {
  applicationRound: ApplicationRoundType;
  handleAdd: (ru: ReservationUnitType) => void;
  handleRemove: (ru: ReservationUnitType) => void;
  currentReservationUnits: ReservationUnitType[];
  options: OptionsType;
}): JSX.Element => {
  const [searchTerm, setSearchTerm] = useState<string | undefined>(undefined);
  const [reservationUnitType, setReservationUnitType] = useState<
    OptionType | undefined
  >(undefined);
  const [unit, setUnit] = useState<OptionType | undefined>(undefined);
  const [maxPersons, setMaxPersons] = useState<OptionType | undefined>(
    undefined
  );

  const reservationUnitTypeOptions = [emptyOption].concat(
    options.reservationUnitTypeOptions
  );

  const participantCountOptions = [emptyOption].concat(
    options.participantCountOptions
  );

  const unitOptions = [emptyOption].concat(options.unitOptions);

  const { t } = useTranslation();

  const { data, refetch, loading } = useQuery<Query, QueryReservationUnitsArgs>(
    RESERVATION_UNITS,
    {
      skip: !applicationRound.pk,
      variables: {
        applicationRound: [applicationRound.pk?.toString() ?? ""],
        textSearch: searchTerm,
        maxPersonsGte: Number(maxPersons?.value),
        reservationUnitType: reservationUnitType?.value
          ? [reservationUnitType?.value?.toString()]
          : [],
        unit: unit?.value ? [unit?.value?.toString()] : [],
        orderBy: "nameFi",
        isDraft: false,
        isVisible: true,
      },
      notifyOnNetworkStatusChange: true,
      fetchPolicy: "no-cache",
    }
  );

  const reservationUnits =
    data?.reservationUnits?.edges
      .map((n) => n?.node)
      .filter((n): n is ReservationUnitType => n !== null) ?? [];

  return (
    <MainContainer>
      <Heading>{t("reservationUnitModal:heading")}</Heading>
      <Text>{getApplicationRoundName(applicationRound)}</Text>
      <Filters>
        <TextInput
          id="reservationUnitSearch.search"
          label={t("reservationUnitModal:searchTermLabel")}
          onChange={(e: ChangeEvent<HTMLInputElement>): void => {
            setSearchTerm(e.target.value);
          }}
        />
        <Select
          id="reservationUnitSearch.reservationUnitType"
          placeholder={t("common:select")}
          options={reservationUnitTypeOptions}
          label={t("reservationUnitModal:searchReservationUnitTypeLabel")}
          onChange={(selection: OptionType): void => {
            setReservationUnitType(selection);
          }}
          defaultValue={emptyOption}
        />
        <Select
          id="participantCountFilter"
          placeholder={t("common:select")}
          options={participantCountOptions}
          label={t("searchForm:participantCountLabel")}
          onChange={(selection: OptionType): void => {
            setMaxPersons(selection);
          }}
          defaultValue={emptyOption}
        />
        <Select
          id="reservationUnitSearch.unit"
          placeholder={t("common:select")}
          options={unitOptions}
          label={t("reservationUnitModal:searchUnitLabel")}
          onChange={(selection: OptionType): void => {
            setUnit(selection);
          }}
          defaultValue={emptyOption}
        />
      </Filters>
      <ButtonContainer>
        <SearchButton
          onClick={(e) => {
            e.preventDefault();
            refetch();
          }}
        >
          {t("common:search")}
        </SearchButton>
        {loading && <StyledLoadingSpinner />}
      </ButtonContainer>
      <Ruler />
      <Results>
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
      </Results>
    </MainContainer>
  );
};

export default ReservationUnitModal;
