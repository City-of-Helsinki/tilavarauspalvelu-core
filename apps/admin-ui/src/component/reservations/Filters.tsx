import React, { useEffect, useReducer } from "react";
import { DateInput, NumberInput, TextInput } from "hds-react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import i18next from "i18next";
import ShowAllContainer from "common/src/components/ShowAllContainer";
import type { OptionType } from "@/common/types";
import ReservationUnitTypeFilter from "../filters/ReservationUnitTypeFilter";
import Tags, { Action, getReducer, toTags } from "../lists/Tags";
import UnitFilter from "../filters/UnitFilter";
import ReservationUnitFilter from "../filters/ReservationUnitFilter";
import ReservationStateFilter from "../filters/ReservationStateFilter";
import PaymentStatusFilter from "./PaymentStatusFilter";
import { AutoGrid } from "@/styles/layout";

export type FilterArguments = {
  reservationUnitType: Array<{ label: string; value: number }>;
  unit: Array<{ label: string; value: number }>;
  reservationUnit: OptionType[];
  reservationState: OptionType[];
  paymentStatuses: OptionType[];
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
  "paymentStatuses",
];

type Props = {
  onSearch: (args: FilterArguments) => void;
  initialFiltering?: Partial<FilterArguments>;
};

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--spacing-s);
`;

const MoreWrapper = styled(ShowAllContainer)`
  .ShowAllContainer__ToggleButton {
    color: var(--color-bus);
  }
`;

export const emptyState: FilterArguments = {
  reservationUnitType: [],
  unit: [],
  reservationUnit: [],
  paymentStatuses: [],
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

function Filters({ onSearch, initialFiltering }: Props): JSX.Element {
  const { t } = useTranslation();
  const initialEmptyState = { ...emptyState, ...initialFiltering };

  const [state, dispatch] = useReducer(
    getReducer<FilterArguments>(initialEmptyState),
    initialEmptyState
  );

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
    <Wrapper>
      <AutoGrid>
        <ReservationUnitTypeFilter
          onChange={(reservationUnitType) =>
            dispatch({ type: "set", value: { reservationUnitType } })
          }
          value={state.reservationUnitType}
        />
        <ReservationStateFilter
          onChange={(reservationState) =>
            dispatch({ type: "set", value: { reservationState } })
          }
          value={state.reservationState}
        />
        <UnitFilter
          onChange={(unit) => dispatch({ type: "set", value: { unit } })}
          value={state.unit}
        />
        <MyTextInput
          id="textSearch"
          dispatch={dispatch}
          value={state.textSearch || ""}
        />
        <PaymentStatusFilter
          onChange={(paymentStatuses) =>
            dispatch({ type: "set", value: { paymentStatuses } })
          }
          value={state.paymentStatuses || []}
        />
        <ReservationUnitFilter
          onChange={(reservationUnit) =>
            dispatch({ type: "set", value: { reservationUnit } })
          }
          // FIXME should not coerce types (it's correct now, but not after 6 months)
          value={state.reservationUnit as { value: number; label: string }[]}
        />
        <DateInput
          language="fi"
          id="begin"
          label={t("ReservationsSearch.begin")}
          onChange={(begin) => dispatch({ type: "set", value: { begin } })}
          value={state.begin}
        />
        <DateInput
          id="end"
          language="fi"
          label={t("ReservationsSearch.end")}
          onChange={(end) => dispatch({ type: "set", value: { end } })}
          value={state.end}
        />
      </AutoGrid>
      <MoreWrapper
        showAllLabel={t("ReservationUnitsSearch.moreFilters")}
        showLessLabel={t("ReservationUnitsSearch.lessFilters")}
        maximumNumber={0}
      >
        <AutoGrid>
          <NumberInput
            type="number"
            value={
              state.minPrice === "" ? state.minPrice : Number(state.minPrice)
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
          <NumberInput
            type="number"
            value={
              state.maxPrice === "" ? state.maxPrice : Number(state.maxPrice)
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
        </AutoGrid>
      </MoreWrapper>
      <Tags tags={tags} t={t} dispatch={dispatch} />
    </Wrapper>
  );
}

export default Filters;
