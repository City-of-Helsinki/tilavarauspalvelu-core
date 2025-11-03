import React from "react";
import { type Control, type FieldValues, type Path, useController, type UseControllerProps } from "react-hook-form";
import { IconGroup, IconUser } from "hds-react";
import { useTranslation } from "next-i18next";
import styled from "styled-components";
import { ReserveeType } from "../../gql/gql-types";
import { ErrorText } from "../components/ErrorText";
import IconPremises from "../icons/IconPremises";
import { Flex, FullRow } from "../styled";
import { RadioButtonWithImage } from "./RadioButtonWithImage";

const TypeLabel = styled(FullRow).attrs({ as: "p" })`
  margin: 0;
`;

const OuterWrapper = styled(Flex).attrs({
  $gap: "2-xs",
})`
  grid-column: 1 / -1;
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

interface CustomerTypeSelectorProps<T extends FieldValues> extends UseControllerProps<T> {
  name: Path<T>;
  control: Control<T>;
  required?: boolean;
  error?: string;
  style?: React.CSSProperties;
  className?: string;
}

export function CustomerTypeSelector<T extends FieldValues>({
  name,
  control,
  required,
  error,
  style,
  className,
}: CustomerTypeSelectorProps<T>) {
  const { t } = useTranslation();
  const {
    field: { value, onChange },
  } = useController({ name, control });
  return (
    <OuterWrapper className={className} style={style}>
      <TypeLabel id="reserveeType-label">
        {t("reservationApplication:reserveeTypePrefix")}
        {required ? " *" : ""}
      </TypeLabel>
      <Flex $wrap="wrap" $direction="row" data-testid="reservation__checkbox--reservee-type">
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
      </Flex>
      {error && <ErrorText>{error}</ErrorText>}
    </OuterWrapper>
  );
}
