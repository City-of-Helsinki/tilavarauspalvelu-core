import { IconArrowRight, IconSignout } from "hds-react";
import React from "react";
import styled from "styled-components";
import { IconButton } from "common/src/components";
import { useSession } from "next-auth/react";
import { t } from "i18next";
import { signOut } from "../../modules/auth";

const ReturnLinkContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
`;

const ReturnLink = styled(IconButton)`
  color: var(--color-black) !important;
`;

const ReturnLinkList = ({
  reservationUnitHome,
  style,
}: {
  reservationUnitHome: string;
  style: React.CSSProperties;
}): JSX.Element => {
  const { data: session } = useSession();
  return (
    <ReturnLinkContainer style={style}>
      <ReturnLink
        href={reservationUnitHome}
        label={t("reservations:backToReservationUnit")}
        icon={<IconArrowRight aria-hidden />}
      />
      <ReturnLink
        href="/"
        label={t("common:gotoFrontpage")}
        icon={<IconArrowRight aria-hidden />}
      />
      <ReturnLink
        icon={<IconSignout aria-hidden />}
        onClick={() => signOut({ session })}
        label={t("common:logout")}
      />
    </ReturnLinkContainer>
  );
};

export default ReturnLinkList;
