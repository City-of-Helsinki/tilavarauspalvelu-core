import { breakpoints } from "common/src/common/style";
import { fontMedium, H2 } from "common/src/common/typography";
import { IconArrowRight, IconSignout } from "hds-react";
import Link from "next/link";
import React from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { Container } from "common";

import { Paragraph } from "./styles";
import { singleSearchUrl } from "../../modules/util";
import { useLogout } from "../../hooks/useLogout";
import { LinkButton } from "../../styles/util";

type Props = {
  type: "reservation" | "order";
};

const StyledContainer = styled(Container)`
  padding: var(--spacing-m) var(--spacing-m) var(--spacing-layout-m);

  @media (min-width: ${breakpoints.m}) {
    max-width: 1000px;
    margin-bottom: var(--spacing-layout-l);
  }
`;

const Wrapper = styled.div`
  align-items: flex-start;
`;

const Heading = styled(H2).attrs({ as: "h1" })``;

const ActionContainer = styled.div`
  display: flex;
  gap: var(--spacing-m);
  flex-direction: column;
  align-items: flex-start;
`;

const StyledLink = styled(Link)`
  display: flex;
  align-items: center;
  gap: var(--spacing-2-xs);
  text-decoration: underline;
  color: var(--color-black) !important;
  ${fontMedium}
`;

const ReservationFail = ({ type }: Props) => {
  const { t } = useTranslation();
  const { logout } = useLogout();

  const headingKey =
    type === "reservation"
      ? "reservationExpired"
      : type === "order"
      ? "orderInvalid"
      : null;

  return (
    <StyledContainer>
      <Wrapper>
        <div>
          <Heading>{t(`reservations:${headingKey}`)}</Heading>
          {type === "reservation" && (
            <Paragraph style={{ margin: "var(--spacing-xl) 0" }}>
              {t("reservations:reservationExpiredDescription")}
            </Paragraph>
          )}
          <ActionContainer
            style={{
              marginTop: "var(--spacing-3-xl)",
            }}
          >
            <StyledLink href={singleSearchUrl({})}>
              {t("reservations:backToSearch")}
              <IconArrowRight aria-hidden size="m" />
            </StyledLink>
            <StyledLink href="/">
              {t("common:gotoFrontpage")}
              <IconArrowRight aria-hidden size="m" />
            </StyledLink>
            <LinkButton onClick={() => logout()}>
              {t("common:logout")} <IconSignout size="m" aria-hidden />
            </LinkButton>
          </ActionContainer>
        </div>
      </Wrapper>
    </StyledContainer>
  );
};

export default ReservationFail;
