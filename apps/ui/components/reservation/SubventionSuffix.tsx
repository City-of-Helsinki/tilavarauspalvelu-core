import React from "react";
import { useTranslation } from "next-i18next";
import styled from "styled-components";

type Props = {
  placement: "reservation-unit-head" | "quick-reservation";
  ref: React.MutableRefObject<HTMLAnchorElement>;
  setIsDialogOpen: (value: boolean) => void;
};

const Anchor = styled.a`
  text-decoration: underline;
  color: var(--color-black);
  word-break: keep-all;
`;

const SubventionSuffix = ({
  placement,
  ref,
  setIsDialogOpen,
}: Props): JSX.Element => {
  const { t } = useTranslation();

  return (
    <>
      {", "}
      <Anchor
        href="#"
        ref={ref}
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
