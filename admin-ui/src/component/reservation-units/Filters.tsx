import { Button, IconAngleDown, IconAngleUp, TextInput } from "hds-react";
import { isEmpty } from "lodash";
import React, { useEffect, useReducer, useState } from "react";
import { useQuery } from "@apollo/client";
import { useTranslation } from "react-i18next";
import i18next from "i18next";
import styled from "styled-components";
import { breakpoints } from "../../styles/util";
import { Query, QueryReservationUnitTypesArgs } from "../../common/gql-types";
import SortedCompobox from "../ReservationUnits/ReservationUnitEditor/SortedSelect";
import { RESERVATION_UNIT_TYPES_QUERY } from "./queries";
import { OptionType } from "../../common/types";
import UnitFilter from "../filters/UnitFilter";
import Tags, { Action, getReducer, toTags } from "../lists/Tags";

export type FilterArguments = {
  nameFi?: string;
  maxPersonsGte?: string;
  maxPersonsLte?: string;
  surfaceAreaGte?: string;
  surfaceAreaLte?: string;
  unit: OptionType[];
  reservationUnitType: OptionType[];
};

const multivaluedFields = ["unit", "reservationUnitType"];

type Props = {
  onSearch: (args: FilterArguments) => void;
};

const Grid3Container = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--spacing-l);
  @media (min-width: ${breakpoints.l}) {
    grid-template-columns: 1fr 1fr 1fr;
  }
`;

const Grid2Container = styled(Grid3Container)`
  @media (min-width: ${breakpoints.l}) {
    grid-template-columns: 1fr 1fr;
  }
`;

const RangeContrainer = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  align-items: top;
  text-align: center;
`;

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--spacing-layout-xs);
`;

const ThinButton = styled(Button)`
  margin: var(--spacing-xs) 0 0 0;
  border: 0;
  padding-left: 0;
  span {
    padding: 0;
    line-height: 1;
  }
`;

const Buttons = styled.div``;

export const emptyState = { reservationUnitType: [], unit: [] };

type TypeComboboxProps = {
  onChange: (reservationUnitType: OptionType[]) => void;
  value: OptionType[];
};

const TypeCombobox = ({ onChange, value }: TypeComboboxProps): JSX.Element => {
  const { t } = useTranslation();
  const { data, loading } = useQuery<Query, QueryReservationUnitTypesArgs>(
    RESERVATION_UNIT_TYPES_QUERY,
    {}
  );

  if (loading) {
    return <>{t("ReservationUnitsSearch.typeLabel")}</>;
  }

  return (
    <SortedCompobox
      sort
      label={t("ReservationUnitsSearch.typeLabel")}
      multiselect
      placeholder={t("ReservationUnitsSearch.typePlaceHolder")}
      options={(data?.reservationUnitTypes?.edges || [])
        .map((e) => e?.node)
        .map((type) => ({
          label: type?.nameFi as string,
          value: String(type?.pk),
        }))}
      onChange={(units) => onChange(units)}
      id="type-combobox"
      value={value}
    />
  );
};

const MyTextInput = ({
  id,
  value,
  dispatch,
}: {
  id: keyof FilterArguments;
  value?: string;
  dispatch: React.Dispatch<Action<FilterArguments>>;
}) => (
  <TextInput
    id={id}
    label=" "
    onChange={(e) => {
      if (e.target.value.length > 0) {
        dispatch({
          type: "set",
          value: { [id]: e.target.value },
        });
      } else {
        dispatch({
          type: "deleteTag",
          field: id,
        });
      }
    }}
    value={value || ""}
    placeholder={i18next.t(`ReservationUnitsSearch.${id}PlaceHolder`)}
    errorText={
      !isEmpty(value) && Number.isNaN(Number(value))
        ? i18next.t("ReservationUnitsSearch.notANumber")
        : undefined
    }
  />
);

const Filters = ({ onSearch }: Props): JSX.Element => {
  const { t } = useTranslation();
  const [state, dispatch] = useReducer(
    getReducer<FilterArguments>(emptyState),
    emptyState
  );
  const [more, setMore] = useState(false);

  useEffect(() => {
    onSearch(state);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  const tags = toTags(state, t, multivaluedFields);

  return (
    <div>
      <Wrapper>
        <Grid3Container>
          <TextInput
            id="text"
            label={t("ReservationUnitsSearch.textSearchLabel")}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                onSearch(state);
              }
            }}
            onChange={(e) =>
              dispatch({ type: "set", value: { nameFi: e.target.value } })
            }
            placeholder={t("ReservationUnitsSearch.textSearchPlaceHolder")}
            value={state.nameFi || ""}
          />
          <UnitFilter
            onChange={(e) => dispatch({ type: "set", value: { unit: e } })}
            value={state.unit}
          />
          <TypeCombobox
            onChange={(e) =>
              dispatch({ type: "set", value: { reservationUnitType: e } })
            }
            value={state.reservationUnitType}
          />
        </Grid3Container>
        {more && (
          <Grid2Container>
            <div>
              <div>{t("ReservationUnitsSearch.maxPersonsLabel")}</div>
              <RangeContrainer>
                <MyTextInput
                  id="maxPersonsGte"
                  value={state.maxPersonsGte}
                  dispatch={dispatch}
                />
                <MyTextInput
                  id="maxPersonsLte"
                  value={state.maxPersonsLte}
                  dispatch={dispatch}
                />
              </RangeContrainer>
            </div>
            <div>
              <div>{t("ReservationUnitsSearch.surfaceAreaLabel")}</div>
              <RangeContrainer>
                <MyTextInput
                  id="surfaceAreaGte"
                  value={state.surfaceAreaGte}
                  dispatch={dispatch}
                />
                <MyTextInput
                  id="surfaceAreaLte"
                  value={state.surfaceAreaLte}
                  dispatch={dispatch}
                />
              </RangeContrainer>
            </div>
          </Grid2Container>
        )}
      </Wrapper>

      <Buttons>
        <ThinButton
          variant="supplementary"
          onClick={() => setMore(!more)}
          iconRight={more ? <IconAngleUp /> : <IconAngleDown />}
        >
          {t(
            more
              ? "ReservationUnitsSearch.lessFilters"
              : "ReservationUnitsSearch.moreFilters"
          )}
        </ThinButton>
      </Buttons>
      <Tags tags={tags} t={t} dispatch={dispatch} />
    </div>
  );
};

export default Filters;
