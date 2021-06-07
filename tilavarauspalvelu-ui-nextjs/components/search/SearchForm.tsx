import React, { useEffect, useState } from "react";
import { useTranslation } from "next-i18next";
import { Select, TextInput, Button as HDSButton, IconSearch } from "hds-react";
import { useForm } from "react-hook-form";
import styled from "styled-components";
import { breakpoint } from "../../modules/style";
import { getApplicationRounds, getParameters } from "../../modules/api";
import { mapOptions, getSelectedOption } from "../../modules/util";
import { emptyOption, participantCountOptions } from "../../modules/const";
import { OptionType } from "../../modules/types";

type Props = {
  onSearch: (search: Record<string, string>) => void;
  formValues: { [key: string]: string };
};

const Button = styled(HDSButton)`
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
  const [ready, setReady] = useState<boolean>(false);
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
        mapOptions(fetchedApplicationPeriods, t("common.select"), i18n.language)
      );
      const fetchedReservationUnitTypes = await getParameters(
        "reservation_unit_type"
      );
      setReservationUnitTypeOptions(
        mapOptions(
          fetchedReservationUnitTypes,
          t("common.select"),
          i18n.language
        )
      );
      setReady(true);
    }
    fetchData();
  }, []);

  useEffect(() => {
    Object.keys(formValues).forEach((p) => setValue(p, formValues[p]));
  }, [formValues, setValue]);

  const search = (criteria: Record<string, string>) => {
    onSearch(criteria);
  };

  if (!ready) {
    return null;
  }

  return (
    <>
      <Container>
        <TextInput
          id="search"
          name="search"
          label="&nbsp;"
          ref={register()}
          placeholder={t("SearchForm.searchTermPlaceholder")}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleSubmit(search)();
            }
          }}
          defaultValue={formValues.search}
        />
        <Select
          id="applicationRound"
          placeholder={t("common.select")}
          options={applicationPeriodOptions}
          onChange={(selection: OptionType): void => {
            setValue("applicationRound", selection.value);
          }}
          defaultValue={getSelectedOption(
            getValues("applicationRound"),
            applicationPeriodOptions
          )}
          label={t("SearchForm.roundLabel")}
        />
        <Select
          id="participantCountFilter"
          placeholder={t("common.select")}
          options={[emptyOption(t("common.select"))].concat(
            participantCountOptions
          )}
          label={t("SearchForm.participantCountLabel")}
          onChange={(selection: OptionType): void => {
            setValue("maxPersons", selection.value);
          }}
          defaultValue={getSelectedOption(
            getValues("maxPersons"),
            participantCountOptions
          )}
        />
        <Select
          placeholder={t("common.select")}
          options={reservationUnitTypeOptions}
          label={t("SearchForm.typeLabel")}
          onChange={(selection: OptionType): void => {
            setValue("reservationUnitType", selection.value);
          }}
          defaultValue={getSelectedOption(
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
          {t("SearchForm.searchButton")}
        </Button>
      </ButtonContainer>
    </>
  );
};

export default SearchForm;
