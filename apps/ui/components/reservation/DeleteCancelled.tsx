import { breakpoints } from "common/src/common/style";
import { H2, fontMedium } from "common/src/common/typography";
import React from "react";
import { useTranslation } from "next-i18next";
import styled from "styled-components";
import Link from "next/link";
import { IconArrowRight, IconSignout } from "hds-react";
import { Container } from "common";
import { signOut } from "common/src/browserHelpers";
import { Paragraph } from "./styles";
import { LinkButton } from "../../styles/util";
import { getSingleSearchPath } from "@/modules/urls";

type Props = {
  reservationPk: string;
  error: boolean;
  apiBaseUrl: string;
};

const Heading = styled(H2).attrs({ as: "h1" })``;

const StyledContainer = styled(Container).attrs({ size: "s" })`
  padding: var(--spacing-m) var(--spacing-m) var(--spacing-layout-m);

  @media (min-width: ${breakpoints.m}) {
    margin-bottom: var(--spacing-layout-l);
  }
`;

const Columns = styled.div`
  grid-template-columns: 1fr;
  display: grid;
  align-items: flex-start;
  gap: var(--spacing-m);

  @media (min-width: ${breakpoints.m}) {
    & > div:nth-of-type(1) {
      order: 2;
    }

    margin-top: var(--spacing-xl);
    grid-template-columns: 1fr 378px;
  }
`;

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

const DeleteCancelled = ({ reservationPk, error, apiBaseUrl }: Props) => {
  const { t } = useTranslation();

  if (!reservationPk && !error) {
    return null;
  }

  if (error) {
    return (
      <StyledContainer>
        <Columns>
          <div>
            <Heading>{t("common:error.error")}</Heading>
            <Paragraph>{t("errors:general_error")}</Paragraph>
          </div>
        </Columns>
      </StyledContainer>
    );
  }

  return (
    <StyledContainer>
      <Columns>
        <div>
          <Heading>{t("reservations:reservationCancelledTitle")}</Heading>
          <ActionContainer
            style={{
              marginTop: "var(--spacing-3-xl)",
            }}
          >
            <StyledLink href={getSingleSearchPath()}>
              {t("reservations:backToSearch")}
              <IconArrowRight aria-hidden size="m" />
            </StyledLink>
            <StyledLink href="/">
              {t("common:gotoFrontpage")}
              <IconArrowRight aria-hidden size="m" />
            </StyledLink>
            <LinkButton onClick={() => signOut(apiBaseUrl)}>
              {t("common:logout")} <IconSignout size="m" aria-hidden />
            </LinkButton>
          </ActionContainer>
        </div>
      </Columns>
    </StyledContainer>
  );
};

export default DeleteCancelled;
