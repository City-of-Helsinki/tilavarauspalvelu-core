import { IconArrowRight, IconSignout } from "hds-react";
import React from "react";
import styled from "styled-components";
import { IconButton } from "common/src/components";
import { useTranslation } from "next-i18next";
import { signOut } from "../../hooks/auth";

const ReturnLinkContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
`;

const ReturnLinkList = ({
  reservationUnitHome,
  style,
}: {
  reservationUnitHome: string;
  style: React.CSSProperties;
}): JSX.Element => {
  const { t } = useTranslation();
  return (
    <ReturnLinkContainer style={style}>
      <IconButton
        href={reservationUnitHome}
        label={t("reservations:backToReservationUnit")}
        icon={<IconArrowRight aria-hidden />}
      />
      <IconButton
        href="/"
        label={t("common:gotoFrontpage")}
        icon={<IconArrowRight aria-hidden />}
      />
      <IconButton
        icon={<IconSignout aria-hidden />}
        onClick={() => signOut()}
        label={t("common:logout")}
      />
    </ReturnLinkContainer>
  );
};

export default ReturnLinkList;
