import { Button, IconAngleDown, IconAngleUp, Tag, TextInput } from "hds-react";
import { get, isEmpty, omit } from "lodash";
import React, { useEffect, useReducer, useState } from "react";
import { useQuery } from "@apollo/client";
import { TFunction, useTranslation } from "react-i18next";
import i18next from "i18next";
import styled from "styled-components";
import { breakpoints } from "../../styles/util";
import {
  Query,
  QueryReservationUnitTypesArgs,
  QueryUnitsArgs,
} from "../../common/gql-types";
import { UNITS_QUERY } from "../../common/queries";
import SortedCompobox from "../ReservationUnits/ReservationUnitEditor/SortedCompobox";
import { RESERVATION_UNIT_TYPES_QUERY } from "./queries";
import { OptionType } from "../../common/types";

export type FilterArguments = {
  nameFi?: string;
  maxPersonsGte?: string;
  maxPersonsLte?: string;
  surfaceAreaGte?: string;
  surfaceAreaLte?: string;
  unit: OptionType[];
  reservationUnitType: OptionType[];
  sort?: string;
};

const arrayFileds = ["unit", "reservationUnitType"];

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

const Tags = styled.div`
  display: flex;
  gap: var(--spacing-3-xl);
  flex-wrap: wrap;
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

type Action =
  | { type: "set"; value: Partial<FilterArguments> }
  | { type: "deleteTag"; field: keyof FilterArguments; value?: string }
  | { type: "reset" };

const reducer = (state: FilterArguments, action: Action): FilterArguments => {
  switch (action.type) {
    case "set": {
      return { ...state, ...action.value };
    }

    case "reset": {
      return emptyState;
    }

    case "deleteTag": {
      if (arrayFileds.includes(action.field)) {
        return {
          ...state,
          [action.field]: (state[action.field] as OptionType[]).filter(
            (v) => v.value !== action.value
          ),
        };
      }
      return omit(state, action.field) as FilterArguments;
    }

    default:
      return { ...state };
  }
};

type UnitComboboxProps = {
  onChange: (units: OptionType[]) => void;
  value: OptionType[];
};

const UnitCombobox = ({ onChange, value }: UnitComboboxProps): JSX.Element => {
  const { t } = useTranslation();
  const { data, loading } = useQuery<Query, QueryUnitsArgs>(UNITS_QUERY, {});

  if (loading) {
    return <>{t("ReservationUnitsSearch.unit")}</>;
  }

  return (
    <SortedCompobox
      sort
      label={t("ReservationUnitsSearch.unitLabel")}
      multiselect
      placeholder={t("ReservationUnitsSearch.unitPlaceHolder")}
      options={(data?.units?.edges || [])
        .map((e) => e?.node)
        .map((unit) => ({
          label: unit?.nameFi as string,
          value: String(unit?.pk as number),
        }))}
      value={value}
      onChange={onChange}
      id="reservation-unit-combobox"
    />
  );
};

type Tag = {
  key: string;
  value: string;
  ac: Action;
};

const toTags = (state: FilterArguments, t: TFunction): Tag[] => {
  return (Object.keys(state) as unknown as (keyof FilterArguments)[]).flatMap(
    (key) => {
      if (arrayFileds.includes(key)) {
        return (get(state, key) as []).map(
          (v: OptionType) =>
            ({
              key: `${key}.${v.value}`,
              value: v.label,
              ac: { type: "deleteTag", field: key, value: v.value },
            } as Tag)
        );
      }

      return [
        {
          key,
          value:
            key === "nameFi"
              ? `"${state.nameFi}"`
              : t(`ReservationUnitsSearch.filter.${key}`),
          ac: {
            type: "deleteTag",
            field: key,
          },
        } as Tag,
      ];
    }
  );
};

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
  dispatch: React.Dispatch<Action>;
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

const SearchForm = ({ onSearch }: Props): JSX.Element => {
  const { t } = useTranslation();
  const [state, dispatch] = useReducer(reducer, emptyState);
  const [more, setMore] = useState(false);

  useEffect(() => {
    onSearch(state);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  const tags = toTags(state, t);

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
          <UnitCombobox
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
      {tags.length ? (
        <Tags>
          {tags.map((tag) => (
            <Tag id={tag.key} onDelete={() => dispatch(tag.ac)} key={tag.key}>
              {tag.value}
            </Tag>
          ))}
          {tags.length > 0 && (
            <Tag
              id="delete"
              onDelete={() => dispatch({ type: "reset" })}
              theme={{ "--tag-background": "transparent" }}
            >
              {t("ReservationUnitsSearch.clear")}
            </Tag>
          )}
        </Tags>
      ) : null}
    </div>
  );
};

export default SearchForm;
