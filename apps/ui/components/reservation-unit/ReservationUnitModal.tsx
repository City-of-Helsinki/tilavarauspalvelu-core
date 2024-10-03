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
import styled from "styled-components";
import type { OptionType } from "common/types/common";
import { fontMedium } from "common/src/common/typography";
import { breakpoints } from "common/src/common/style";
import {
  ReservationUnitOrderingChoices,
  useSearchReservationUnitsQuery,
  type ReservationUnitCardFieldsFragment,
  type ApplicationQuery,
} from "@gql/gql-types";
import { filterNonNullable, getImageSource } from "common/src/helpers";
import { getAddressAlt, getMainImage, getTranslation } from "@/modules/util";
import { MediumButton } from "@/styles/util";
import { getApplicationRoundName } from "@/modules/applicationRound";
import { getReservationUnitName, getUnitName } from "@/modules/reservationUnit";
import IconWithText from "../common/IconWithText";
import { getReservationUnitPath } from "@/modules/urls";

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

function ReservationUnitCard({
  reservationUnit,
  handleAdd,
  handleRemove,
  isSelected,
}: {
  reservationUnit: ReservationUnitType;
  isSelected: boolean;
  handleAdd: (ru: ReservationUnitType) => void;
  handleRemove: (ru: ReservationUnitType) => void;
}) {
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

  return (
    <Container>
      <Image alt={name} src={imgSrc} />
      <Main>
        <Name>{name}</Name>
        <Unit>{unitName}</Unit>
        <Link
          href={getReservationUnitPath(reservationUnit.pk)}
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
}

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

type Node = NonNullable<ApplicationQuery["application"]>;
type AppRoundNode = NonNullable<Node["applicationRound"]>;
type ReservationUnitType = ReservationUnitCardFieldsFragment;
type OptionsType = {
  purposeOptions: OptionType[];
  reservationUnitTypeOptions: OptionType[];
  participantCountOptions: OptionType[];
  unitOptions: OptionType[];
};

const emptyOption = {
  label: "",
};

function ReservationUnitModal({
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

  const { data, refetch, loading } = useSearchReservationUnitsQuery({
    skip: !applicationRound.pk,
    variables: {
      applicationRound: [applicationRound.pk ?? 0],
      textSearch: searchTerm,
      maxPersons: maxPersons?.value?.toString(),
      reservationUnitType:
        reservationUnitType?.value != null
          ? [Number(reservationUnitType?.value)]
          : [],
      unit: unit?.value != null ? [Number(unit?.value)] : [],
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
}

export default ReservationUnitModal;
