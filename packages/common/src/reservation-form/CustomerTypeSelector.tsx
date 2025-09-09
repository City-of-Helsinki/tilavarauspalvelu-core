import React from "react";
import styled from "styled-components";
import { useTranslation } from "next-i18next";
import { Controller } from "react-hook-form";
import { IconGroup, IconUser } from "hds-react";
import IconPremises from "../icons/IconPremises";
import { ReserveeType } from "../../gql/gql-types";
import { RadioButtonWithImage } from "./RadioButtonWithImage";
import { Flex, FullRow } from "../styled";

const CustomerTypeSelectContainer = styled(Flex).attrs({
  $wrap: "wrap",
  $gap: "m",
  $direction: "row",
})`
  grid-column: 1 / -1;
`;

const TypeLabel = styled(FullRow).attrs({ as: "p" })`
  margin: 0;
`;

const RESERVEE_OPTIONS = [
  {
    id: ReserveeType.Individual,
    icon: <IconUser />,
  },
  {
    id: ReserveeType.Nonprofit,
    icon: <IconGroup />,
  },
  {
    id: ReserveeType.Company,
    icon: <IconPremises width="24" height="24" aria-hidden />,
  },
];

export function CustomerTypeSelector() {
  const { t } = useTranslation();

  return (
    <>
      <TypeLabel id="reserveeType-label">{t("reservationApplication:reserveeTypePrefix")}</TypeLabel>
      <CustomerTypeSelectContainer data-testid="reservation__checkbox--reservee-type">
        <Controller
          name="reserveeType"
          render={({ field: { value, onChange } }) => (
            <>
              {RESERVEE_OPTIONS.map(({ id, icon }) => ({
                choice: id,
                icon,
                name: id,
              })).map(({ choice, icon, name }) => (
                <RadioButtonWithImage
                  key={choice}
                  id={`reserveeType__${name}`}
                  label={t(`reservationApplication:reserveeTypes.labels.${name}`)}
                  onClick={() => onChange(choice)}
                  icon={icon}
                  checked={value === choice}
                />
              ))}
            </>
          )}
        />
      </CustomerTypeSelectContainer>
    </>
  );
}
