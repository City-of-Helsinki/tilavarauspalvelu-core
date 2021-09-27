import { Button, IconCross, TextInput } from "hds-react";
import { isEmpty } from "lodash";
import React, { useReducer } from "react";
import { useTranslation } from "react-i18next";
import i18next from "i18next";
import styled from "styled-components";
import { ReservationUnitTypeType } from "../../common/types";
import { IngressContainer } from "../../styles/layout";
import { breakpoints } from "../../styles/util";

export type SearchArguments = {
  textSearch?: string;
  maxPersonsGte?: string;
  maxPersonsLte?: string;
  type?: ReservationUnitTypeType;
  surfaceAreaLow?: string;
  surfaceAreaHigh?: string;
};

type Props = {
  onSearch: (args: SearchArguments) => void;
};

type Action =
  | { type: "set"; value: { [key: string]: string } }
  | { type: "reset" };

const Wrapper = styled.div`
  padding-top: var(--spacing-m);
  @media (min-width: ${breakpoints.l}) {
    padding: var(--spacing-2-xl);
  }
  background-color: var(--color-black-5);
  max-width: 100%;
  margin-bottom: var(--spacing-layout-l);
`;

const GridContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--spacing-2-xl);
  @media (min-width: ${breakpoints.l}) {
    grid-template-columns: 1fr 1fr;
  }
  padding-bottom: var(--spacing-2-xl);
`;
const ButtonContainer = styled.div`
  display: flex;
  width: 100%;
`;

const RangeContrainer = styled.div`
  display: grid;
  grid-template-columns: 4fr 2em 4fr;
  gap: var(--spacing-xs);
  align-items: top;
  text-align: center;
`;

const ResetButton = styled(Button)`
  margin-left: auto;
`;

const Dash = styled.div`
  margin-top: 1.25em;
`;

const reducer = (state: SearchArguments, action: Action): SearchArguments => {
  switch (action.type) {
    case "set": {
      return { ...state, ...action.value };
    }

    case "reset": {
      return {};
    }

    default:
      return { ...state };
  }
};

const MyTextInput = ({
  id,
  value,
  dispatch,
}: {
  id: string;
  value?: string;
  dispatch: React.Dispatch<Action>;
}) => (
  <TextInput
    id={id}
    label=" "
    onChange={(e) =>
      dispatch({
        type: "set",
        value: { [id]: e.target.value },
      })
    }
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
  const [state, dispatch] = useReducer(reducer, {});

  return (
    <Wrapper>
      <IngressContainer>
        <GridContainer>
          <TextInput
            id="text"
            label={t("ReservationUnitsSearch.textSearchLabel")}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                onSearch(state);
              }
            }}
            onChange={(e) =>
              dispatch({ type: "set", value: { textSearch: e.target.value } })
            }
            placeholder={t("ReservationUnitsSearch.textSearchPlaceHolder")}
            value={state.textSearch || ""}
          />
        </GridContainer>
        <GridContainer>
          <div>
            <div>{t("ReservationUnitsSearch.maxPersonsLabel")}</div>
            <RangeContrainer>
              <MyTextInput
                id="maxPersonsGte"
                value={state.maxPersonsGte}
                dispatch={dispatch}
              />
              <Dash>-</Dash>
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
                id="surfaceAreaLow"
                value={state.surfaceAreaLow}
                dispatch={dispatch}
              />
              <Dash>-</Dash>
              <MyTextInput
                id="surfaceAreaHigh"
                value={state.surfaceAreaHigh}
                dispatch={dispatch}
              />
            </RangeContrainer>
          </div>
        </GridContainer>
        <ButtonContainer>
          <Button
            onClick={() => {
              onSearch(state);
            }}
          >
            {t("common.search")}
          </Button>
          <ResetButton
            onClick={() => dispatch({ type: "reset" })}
            iconLeft={<IconCross />}
            variant="supplementary"
          >
            {t("ReservationUnitsSearch.clear")}
          </ResetButton>
        </ButtonContainer>
      </IngressContainer>
    </Wrapper>
  );
};

export default SearchForm;
