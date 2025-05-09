import React, { type RefObject } from "react";
import { useTranslation } from "next-i18next";
import styled from "styled-components";

type Props = {
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

export function SubventionSuffix({ setIsDialogOpen }: Props): JSX.Element {
  const { t } = useTranslation();

  return (
    <Btn
      onClick={(e) => {
        e.preventDefault();
        setIsDialogOpen(true);
      }}
    >
      {t("reservationCalendar:subventionAvailable")}
    </Btn>
  );
}
