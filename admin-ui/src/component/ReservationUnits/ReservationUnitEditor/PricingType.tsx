import React from "react";
import { get } from "lodash";
import { useTranslation } from "react-i18next";
import { format, parse, startOfDay } from "date-fns";
import {
  Checkbox,
  DateInput,
  IconAlertCircleFill,
  NumberInput,
  RadioButton,
} from "hds-react";
import {
  ReservationUnitPricingCreateSerializerInput,
  ReservationUnitsReservationUnitPricingPriceUnitChoices,
} from "common/types/gql-types";
import {
  Grid,
  Span3,
  Span4,
  Span6,
  VerticalFlex,
} from "../../../styles/layout";
import { Error } from "./modules/reservationUnitEditor";
import EnumSelect from "./EnumSelect";
import Select from "./Select";
import SortedSelect from "./SortedSelect";

import { Action, State } from "./types";
import { OptionType } from "../../../common/types";
import { formatDecimal } from "../../../common/util";

type Props = {
  getValidationError: (key: string) => string | undefined;
  state: State;
  dispatch: React.Dispatch<Action>;
  type: "PAST" | "ACTIVE" | "FUTURE";
  hasPrice: boolean;
  getSelectedOptions: (
    state: State,
    optionsPropertyName: string,
    valuePropName: string
  ) => OptionType[];
};

const hdsDate = (apiDate: string): string =>
  format(parse(apiDate, "yyyy-MM-dd", new Date()), "dd.MM.yyyy");

const PricingType = ({
  getValidationError,
  state,
  dispatch,
  getSelectedOptions,
  type,
  hasPrice,
}: Props): JSX.Element | null => {
  const labelIndex = type === "ACTIVE" ? 0 : 1;

  const { t } = useTranslation();

  const pricingType = (state.reservationUnitEdit.pricings || []).find(
    (pt) => pt?.status === type
  );

  let pricing: ReservationUnitPricingCreateSerializerInput =
    pricingType as ReservationUnitPricingCreateSerializerInput;

  if (!pricing) {
    if (type === "FUTURE") {
      return hasPrice ? (
        <VerticalFlex>
          <Checkbox
            id="priceChange"
            label={t("ReservationUnitEditor.label.priceChange")}
            onChange={() => dispatch({ type: "toggleFuturePrice" })}
          />
        </VerticalFlex>
      ) : null;
    }
  }

  if (!pricing) {
    pricing = {
      status: "ACTIVE",
      begins: format(startOfDay(new Date()), "yyyy-MM-dd"),
    } as ReservationUnitPricingCreateSerializerInput;
  }

  const setPricingTypeValue = (
    value: Partial<ReservationUnitPricingCreateSerializerInput>,
    changeField?:
      | "lowestPriceNet"
      | "lowestPrice"
      | "highestPriceNet"
      | "highestPrice"
      | "taxPercentagePk"
  ) => {
    dispatch({
      type: "updatePricingType",
      pricingType: {
        ...(pricing as ReservationUnitPricingCreateSerializerInput),
        ...value,
      },
      changeField,
    });
  };

  return (
    <>
      <VerticalFlex>
        {hasPrice && pricing.status === "FUTURE" && (
          <>
            <Checkbox
              id="priceChange"
              label={t("ReservationUnitEditor.label.priceChange")}
              checked
              onChange={() => dispatch({ type: "toggleFuturePrice" })}
            />
            <Grid>
              <Span3>
                <DateInput
                  id="futureDate"
                  value={hdsDate(pricing.begins)}
                  onChange={(e) =>
                    setPricingTypeValue({
                      begins: format(
                        parse(e, "dd.MM.yyyy", new Date()),
                        "yyyy-MM-dd"
                      ),
                    })
                  }
                />
              </Span3>
            </Grid>
          </>
        )}
        <Grid>
          {["FREE", "PAID"].map((typeName, index) => {
            const checked = pricing.pricingType === typeName;

            return (
              <Span4 key={typeName}>
                <RadioButton
                  id={`pricingType.${pricing.status}.${typeName}`}
                  name={`pricingType.${pricing.status}`}
                  label={t(
                    `ReservationUnitEditor.label.pricingTypes.${typeName}`
                  )}
                  value={typeName}
                  checked={checked}
                  onChange={() =>
                    setPricingTypeValue({ pricingType: typeName })
                  }
                />
                {index === 0 && getValidationError("pricings") && !hasPrice && (
                  <Error>
                    <IconAlertCircleFill />
                    <span>{getValidationError("pricings")}</span>
                  </Error>
                )}
              </Span4>
            );
          })}
        </Grid>
        <Grid>
          {pricing.pricingType === "PAID" && (
            <>
              <Span6>
                <EnumSelect
                  optionPrefix="priceUnit"
                  placeholder={t("common.select")}
                  id={`pricings,${labelIndex},priceUnit`}
                  required
                  value={pricing.priceUnit as string}
                  label={t("ReservationUnitEditor.label.priceUnit")}
                  type={ReservationUnitsReservationUnitPricingPriceUnitChoices}
                  onChange={(priceUnit) => setPricingTypeValue({ priceUnit })}
                  tooltipText={t("ReservationUnitEditor.tooltip.priceUnit")}
                  errorText={getValidationError(
                    `pricings,${labelIndex},priceUnit`
                  )}
                />
              </Span6>
              <Span6>
                <Select
                  placeholder={t("common.select")}
                  required
                  id={`pricings,${labelIndex},taxPercentagePk`}
                  label={t(`ReservationUnitEditor.label.taxPercentagePk`)}
                  options={state.taxPercentageOptions}
                  onChange={(selectedVat) => {
                    setPricingTypeValue(
                      {
                        taxPercentagePk: selectedVat as number,
                      },
                      "taxPercentagePk"
                    );
                  }}
                  value={get(pricingType, "taxPercentagePk") as number}
                  errorText={getValidationError(
                    `pricings,${labelIndex},taxPercentagePk`
                  )}
                />
              </Span6>

              <Span3>
                <NumberInput
                  value={
                    typeof pricing.lowestPriceNet === "number"
                      ? pricing.lowestPriceNet
                      : ""
                  }
                  id={`pricings,${labelIndex},lowestPriceNet`}
                  required
                  label={t("ReservationUnitEditor.label.lowestPriceNet")}
                  minusStepButtonAriaLabel={t("common.decreaseByOneAriaLabel")}
                  plusStepButtonAriaLabel={t("common.increaseByOneAriaLabel")}
                  onChange={(e) => {
                    setPricingTypeValue(
                      {
                        lowestPriceNet: formatDecimal({
                          input: e.target.value,
                          decimals: 2,
                        }),
                      },
                      "lowestPriceNet"
                    );
                  }}
                  step={1}
                  min={0}
                  errorText={getValidationError(
                    `pricings,${labelIndex},lowestPriceNet`
                  )}
                  invalid={
                    !!getValidationError(
                      `pricings,${labelIndex},lowestPriceNet`
                    )
                  }
                />
              </Span3>
              <Span3>
                <NumberInput
                  value={
                    typeof pricing.lowestPrice === "number"
                      ? pricing.lowestPrice
                      : ""
                  }
                  id={`pricings,${labelIndex},lowestPrice`}
                  required
                  label={t("ReservationUnitEditor.label.lowestPrice")}
                  minusStepButtonAriaLabel={t("common.decreaseByOneAriaLabel")}
                  plusStepButtonAriaLabel={t("common.increaseByOneAriaLabel")}
                  onChange={(e) => {
                    setPricingTypeValue(
                      {
                        lowestPrice: formatDecimal({
                          input: e.target.value,
                          decimals: 2,
                        }),
                      },
                      "lowestPrice"
                    );
                  }}
                  step={1}
                  min={0}
                  errorText={getValidationError(
                    `pricings,${labelIndex},lowestPrice`
                  )}
                  invalid={
                    !!getValidationError(`pricings,${labelIndex},lowestPrice`)
                  }
                  tooltipText={t("ReservationUnitEditor.tooltip.lowestPrice")}
                />
              </Span3>
              <Span3>
                <NumberInput
                  required
                  value={
                    typeof pricing.highestPriceNet === "number"
                      ? pricing.highestPriceNet
                      : ""
                  }
                  id={`pricings,${labelIndex},highestPriceNet`}
                  label={t("ReservationUnitEditor.label.highestPriceNet")}
                  minusStepButtonAriaLabel={t("common.decreaseByOneAriaLabel")}
                  plusStepButtonAriaLabel={t("common.increaseByOneAriaLabel")}
                  onChange={(e) => {
                    setPricingTypeValue(
                      {
                        highestPriceNet: formatDecimal({
                          input: e.target.value,
                        }),
                      },
                      "highestPriceNet"
                    );
                  }}
                  step={1}
                  min={0}
                  errorText={getValidationError("highestPriceNet")}
                  invalid={!!getValidationError("highestPriceNet")}
                />
              </Span3>
              <Span3>
                <NumberInput
                  required
                  value={
                    typeof pricing.highestPrice === "number"
                      ? pricing.highestPrice
                      : ""
                  }
                  id={`pricings,${labelIndex},highestPrice`}
                  label={t("ReservationUnitEditor.label.highestPrice")}
                  minusStepButtonAriaLabel={t("common.decreaseByOneAriaLabel")}
                  plusStepButtonAriaLabel={t("common.increaseByOneAriaLabel")}
                  onChange={(e) => {
                    setPricingTypeValue(
                      {
                        highestPrice: formatDecimal({
                          input: e.target.value,
                        }),
                      },
                      "highestPrice"
                    );
                  }}
                  step={1}
                  min={0}
                  errorText={getValidationError("highestPrice")}
                  invalid={!!getValidationError("highestPrice")}
                  tooltipText={t("ReservationUnitEditor.tooltip.highestPrice")}
                />
              </Span3>
              {type === "ACTIVE" && (
                <Span3 id="paymentTypes">
                  <SortedSelect
                    id="paymentTypes"
                    sort
                    multiselect
                    required
                    placeholder={t("common.select")}
                    options={state.paymentTypeOptions}
                    value={[
                      ...getSelectedOptions(
                        state,
                        "paymentTypeOptions",
                        "paymentTypes"
                      ),
                    ]}
                    label={t("ReservationUnitEditor.label.paymentTypes")}
                    onChange={(paymentTypes) =>
                      dispatch({ type: "setPaymentTypes", paymentTypes })
                    }
                    tooltipText={t(
                      "ReservationUnitEditor.tooltip.paymentTypes"
                    )}
                    error={getValidationError("paymentTypes")}
                    invalid={!!getValidationError("paymentTypes")}
                  />
                </Span3>
              )}
            </>
          )}
        </Grid>
      </VerticalFlex>
    </>
  );
};

export default PricingType;
