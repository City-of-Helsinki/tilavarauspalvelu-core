import React, { useEffect, useReducer, useState } from "react";
import {
  Button,
  DateInput,
  IconAngleDown,
  IconAngleUp,
  NumberInput,
  TextInput,
} from "hds-react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import i18next from "i18next";
import { OptionType } from "../../common/types";
import { Grid, Span3 } from "../../styles/layout";
import ReservationUnitTypeFilter from "../filters/ReservationUnitTypeFilter";
import Tags, { Action, getReducer, toTags } from "../lists/Tags";
import UnitFilter from "../filters/UnitFilter";
import ReservationUnitFilter from "../filters/ReservationUnitFilter";
import ReservationStateFilter from "../filters/ReservationStateFilter";

export type FilterArguments = {
  reservationUnitType: OptionType[];
  unit: OptionType[];
  reservationUnit: OptionType[];
  reservationState: OptionType[];
  textSearch: string;
  begin: string;
  end: string;
  minPrice: string;
  maxPrice: string;
};

const multivaluedFields = [
  "unit",
  "reservationUnit",
  "reservationUnitType",
  "reservationUnitStates",
  "reservationState",
];

type Props = {
  onSearch: (args: FilterArguments) => void;
  initialFiltering?: Partial<FilterArguments>;
};

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

export const emptyState: FilterArguments = {
  reservationUnitType: [],
  unit: [],
  reservationUnit: [],
  reservationState: [],
  textSearch: "",
  begin: "",
  end: "",
  minPrice: "",
  maxPrice: "",
};

const MyTextInput = ({
  id,
  value,
  dispatch,
}: {
  id: keyof FilterArguments;
  value: string;
  dispatch: React.Dispatch<Action<FilterArguments>>;
}) => (
  <TextInput
    id={id}
    label={i18next.t("ReservationsSearch.textSearch")}
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
    placeholder={i18next.t("ReservationsSearch.textSearchPlaceholder")}
  />
);

const Filters = ({ onSearch, initialFiltering }: Props): JSX.Element => {
  const { t } = useTranslation();
  const initialEmptyState = { ...emptyState, ...initialFiltering };

  const [state, dispatch] = useReducer(
    getReducer<FilterArguments>(initialEmptyState),
    initialEmptyState
  );
  const [more, setMore] = useState(false);

  useEffect(() => {
    onSearch(state);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  const tags = toTags(
    state,
    t,
    multivaluedFields,
    ["textSearch"],
    "ReservationsSearch"
  );

  return (
    <div>
      <Wrapper>
        <Grid>
          <Span3>
            <ReservationUnitTypeFilter
              onChange={(reservationUnitType) =>
                dispatch({ type: "set", value: { reservationUnitType } })
              }
              value={state.reservationUnitType}
            />
          </Span3>
          <Span3>
            <ReservationStateFilter
              onChange={(reservationState) =>
                dispatch({ type: "set", value: { reservationState } })
              }
              value={state.reservationState}
            />
          </Span3>
          <Span3>
            <UnitFilter
              onChange={(unit) => dispatch({ type: "set", value: { unit } })}
              value={state.unit}
            />
          </Span3>
          <Span3>
            <MyTextInput
              id="textSearch"
              dispatch={dispatch}
              value={state.textSearch || ""}
            />
          </Span3>
        </Grid>
        {more && (
          <Grid>
            <Span3>
              <DateInput
                language="fi"
                id="begin"
                label={t("ReservationsSearch.begin")}
                onChange={(begin) =>
                  dispatch({ type: "set", value: { begin } })
                }
                value={state.begin}
              />
            </Span3>
            <Span3>
              <DateInput
                id="end"
                language="fi"
                label={t("ReservationsSearch.end")}
                onChange={(end) => dispatch({ type: "set", value: { end } })}
                value={state.end}
              />
            </Span3>
            <Span3>
              <NumberInput
                type="number"
                value={
                  state.minPrice === ""
                    ? state.minPrice
                    : Number(state.minPrice)
                }
                min={0}
                minusStepButtonAriaLabel={t("common:subtract")}
                plusStepButtonAriaLabel={t("common:add")}
                step={1}
                id="minPrice"
                label={t("ReservationsSearch.minPrice")}
                onChange={(e) =>
                  dispatch({
                    type: "set",
                    value: { minPrice: e.target.value },
                  })
                }
              />
            </Span3>
            <Span3>
              <NumberInput
                type="number"
                value={
                  state.maxPrice === ""
                    ? state.maxPrice
                    : Number(state.maxPrice)
                }
                min={0}
                minusStepButtonAriaLabel={t("common:subtract")}
                plusStepButtonAriaLabel={t("common:add")}
                step={1}
                id="maxPrice"
                label={t("ReservationsSearch.maxPrice")}
                onChange={(e) => {
                  dispatch({
                    type: "set",
                    value: {
                      maxPrice: e.target.value,
                    },
                  });
                }}
              />
            </Span3>
            <Span3>
              <ReservationUnitFilter
                onChange={(reservationUnit) =>
                  dispatch({ type: "set", value: { reservationUnit } })
                }
                value={state.reservationUnit}
              />
            </Span3>
          </Grid>
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
