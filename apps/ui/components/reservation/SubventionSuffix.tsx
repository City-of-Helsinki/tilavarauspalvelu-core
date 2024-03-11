import React, { type RefObject } from "react";
import { useTranslation } from "next-i18next";
import styled from "styled-components";

type Props = {
  placement: "reservation-unit-head" | "quick-reservation";
  setIsDialogOpen: (value: boolean) => void;
  ref?: RefObject<HTMLAnchorElement>;
};

const Anchor = styled.a`
  text-decoration: underline;
  color: var(--color-black);
  word-break: keep-all;
`;

const SubventionSuffix = ({
  placement,
  setIsDialogOpen,
}: Props): JSX.Element => {
  const { t } = useTranslation();

  return (
    <>
      {", "}
      <Anchor
        href="#"
        style={{}}
        onClick={(e) => {
          e.preventDefault();
          setIsDialogOpen(true);
        }}
        data-testid={`link__pricing-terms--${placement}`}
      >
        {t("reservationCalendar:subventionAvailable")}
      </Anchor>
    </>
  );
};

export default SubventionSuffix;
