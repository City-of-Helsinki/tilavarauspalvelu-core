import React, { useEffect, useState } from "react";
import { useTranslation } from "next-i18next";
import { Select, TextInput, IconSearch } from "hds-react";
import { useForm } from "react-hook-form";
import styled from "styled-components";
import { useUpdate } from "react-use";
import { breakpoint } from "../../modules/style";
import { getApplicationRounds, getParameters } from "../../modules/api";
import { mapOptions, getSelectedOption } from "../../modules/util";
import { emptyOption, participantCountOptions } from "../../modules/const";
import { OptionType } from "../../modules/types";
import { MediumButton } from "../../styles/util";

type Props = {
  onSearch: (search: Record<string, string>) => void;
  formValues: { [key: string]: string };
};

const Button = styled(MediumButton)`
  margin-left: var(--spacing-m);
`;

const Container = styled.div`
  @media (max-width: ${breakpoint.xl}) {
    grid-template-columns: 1fr 1fr;
  }

  @media (max-width: ${breakpoint.m}) {
    grid-template-columns: 1fr;
  }

  margin-top: var(--spacing-s);
  max-width: 100%;
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  grid-gap: var(--spacing-m);
  font-size: var(--fontsize-body-m);
`;

const StyledSelect = styled(Select)`
  @media (max-width: ${breakpoint.m}) {
    height: unset;
  }

  height: 82px;
`;

const Hr = styled.hr`
  margin-top: var(--spacing-l);
`;

const ButtonContainer = styled.div`
  margin-top: var(--spacing-l);
  display: flex;
  justify-content: flex-end;
`;

const SearchForm = ({ onSearch, formValues }: Props): JSX.Element | null => {
  const { t, i18n } = useTranslation();
  const update = useUpdate();

  const [reservationUnitTypeOptions, setReservationUnitTypeOptions] = useState<
    OptionType[]
  >([]);
  const [applicationPeriodOptions, setApplicationPeriodOptions] = useState<
    OptionType[]
  >([]);

  const { register, handleSubmit, setValue, getValues } = useForm();

  useEffect(() => {
    register({ name: "purpose" });
    register({ name: "district" });
    register({ name: "applicationRound" });
    register({ name: "maxPersons" });
    register({ name: "reservationUnitType" });
  }, [register]);

  useEffect(() => {
    async function fetchData() {
      const fetchedApplicationPeriods = await getApplicationRounds();
      setApplicationPeriodOptions(
        mapOptions(fetchedApplicationPeriods, t("common:select"), i18n.language)
      );
      const fetchedReservationUnitTypes = await getParameters(
        "reservation_unit_type"
      );
      setReservationUnitTypeOptions(
        mapOptions(
          fetchedReservationUnitTypes,
          t("common:select"),
          i18n.language
        )
      );
    }
    fetchData();
  }, [i18n, t]);

  useEffect(() => {
    Object.keys(formValues).forEach((p) => setValue(p, formValues[p]));
  }, [formValues, setValue]);

  const search = (criteria: Record<string, string>) => {
    onSearch(criteria);
  };

  return (
    <>
      <Container>
        <TextInput
          id="search"
          name="search"
          label="&nbsp;"
          ref={register()}
          placeholder={t("searchForm:searchTermPlaceholder")}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleSubmit(search)();
            }
          }}
          defaultValue={formValues.search}
        />
        <StyledSelect
          id="applicationRound"
          placeholder={t("common:select")}
          options={applicationPeriodOptions}
          onChange={(selection: OptionType): void => {
            setValue("applicationRound", selection.value);
            update();
          }}
          value={getSelectedOption(
            getValues("applicationRound"),
            applicationPeriodOptions
          )}
          label={t("searchForm:roundLabel")}
        />
        <StyledSelect
          id="participantCountFilter"
          placeholder={t("common:select")}
          options={[emptyOption(t("common:select"))].concat(
            participantCountOptions
          )}
          label={t("searchForm:participantCountLabel")}
          onChange={(selection: OptionType): void => {
            setValue("maxPersons", selection.value);
            update();
          }}
          value={getSelectedOption(
            getValues("maxPersons"),
            participantCountOptions
          )}
        />
        <StyledSelect
          placeholder={t("common:select")}
          options={reservationUnitTypeOptions}
          label={t("searchForm:typeLabel")}
          onChange={(selection: OptionType): void => {
            setValue("reservationUnitType", selection.value);
            update();
          }}
          value={getSelectedOption(
            getValues("reservationUnitType"),
            reservationUnitTypeOptions
          )}
        />
      </Container>
      <Hr />
      <ButtonContainer>
        <Button
          id="searchButton"
          onClick={handleSubmit(search)}
          iconLeft={<IconSearch />}
        >
          {t("searchForm:searchButton")}
        </Button>
      </ButtonContainer>
    </>
  );
};

export default SearchForm;
