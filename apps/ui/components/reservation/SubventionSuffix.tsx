import React, { type RefObject } from "react";
import { useTranslation } from "next-i18next";
import styled from "styled-components";

type Props = {
  placement: "reservation-unit-head" | "quick-reservation";
  setIsDialogOpen: (value: boolean) => void;
  ref?: RefObject<HTMLAnchorElement>;
};

const Btn = styled.button`
  display: inline;
  background-color: unset;
  border: unset;
  padding: unset;

  text-decoration: underline;
  color: var(--color-black);
  word-break: keep-all;
`;

export function SubventionSuffix({
  placement,
  setIsDialogOpen,
}: Props): JSX.Element {
  const { t } = useTranslation();

  return (
    <Btn
      onClick={(e) => {
        e.preventDefault();
        setIsDialogOpen(true);
      }}
      data-testid={`link__pricing-terms--${placement}`}
    >
      {t("reservationCalendar:subventionAvailable")}
    </Btn>
  );
}
