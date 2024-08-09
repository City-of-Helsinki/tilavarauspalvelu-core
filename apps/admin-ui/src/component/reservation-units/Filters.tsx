import { TextInput } from "hds-react";
import { isEmpty } from "lodash";
import React, { useEffect, useReducer } from "react";
import { useTranslation } from "react-i18next";
import i18next from "i18next";
import styled from "styled-components";
import { breakpoints } from "common/src/common/style";
import ShowAllContainer from "common/src/components/ShowAllContainer";
import UnitFilter from "../filters/UnitFilter";
import Tags, { Action, getReducer, toTags } from "../lists/Tags";
import { Grid, Span3 } from "@/styles/layout";
import ReservationUnitStateFilter from "../filters/ReservationUnitStateFilter";
import ReservationUnitTypeFilter from "../filters/ReservationUnitTypeFilter";
import { ReservationUnitState } from "@gql/gql-types";

type OptionType = {
  label: string;
  value: number;
};
export type FilterArguments = {
  nameFi?: string;
  maxPersonsGte?: string;
  maxPersonsLte?: string;
  surfaceAreaGte?: string;
  surfaceAreaLte?: string;
  unit: OptionType[];
  reservationUnitType: OptionType[];
  reservationUnitStates: Array<{ label: string; value: ReservationUnitState }>;
};

const multivaluedFields = [
  "unit",
  "reservationUnitType",
  "reservationUnitStates",
];

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

const MoreWrapper = styled(ShowAllContainer)`
  .ShowAllContainer__ToggleButton {
    color: var(--color-bus);
  }
  [class*="ShowAllContainer__ToggleButtonContainer"] {
    margin-top: 0;
  }
`;

export const emptyState = {
  reservationUnitType: [],
  unit: [],
  reservationUnitStates: [],
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

function Filters({ onSearch }: Props): JSX.Element {
  const { t } = useTranslation();
  const [state, dispatch] = useReducer(
    getReducer<FilterArguments>(emptyState),
    emptyState
  );

  useEffect(() => {
    onSearch(state);
  }, [onSearch, state]);

  const tags = toTags(
    state,
    t,
    multivaluedFields,
    ["nameFi"],
    "ReservationUnitsSearch"
  );

  return (
    <div>
      <Wrapper>
        <Grid>
          <Span3>
            <TextInput
              id="nameFi"
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
          </Span3>
          <Span3>
            <UnitFilter
              onChange={(e) => dispatch({ type: "set", value: { unit: e } })}
              value={state.unit}
            />
          </Span3>
          <Span3>
            <ReservationUnitTypeFilter
              onChange={(e) =>
                dispatch({ type: "set", value: { reservationUnitType: e } })
              }
              value={state.reservationUnitType}
            />
          </Span3>
          <Span3>
            <ReservationUnitStateFilter
              value={state.reservationUnitStates}
              onChange={(e) =>
                dispatch({ type: "set", value: { reservationUnitStates: e } })
              }
            />
          </Span3>
        </Grid>
        <MoreWrapper
          showAllLabel={t("ReservationUnitsSearch.moreFilters")}
          showLessLabel={t("ReservationUnitsSearch.lessFilters")}
          maximumNumber={0}
        >
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
        </MoreWrapper>
      </Wrapper>
      <Tags tags={tags} t={t} dispatch={dispatch} />
    </div>
  );
}

export default Filters;
