import { Button as HDSButton, IconArrowRight } from "hds-react";
import React from "react";
import { useTranslation } from "next-i18next";
import { useRouter } from "next/router";
import styled from "styled-components";
import Container from "./Container";

const BackgroundContainer = styled.div`
  background-color: var(--color-bus);
  position: fixed;
  bottom: 0;
  width: 100%;
  z-index: 2;
`;

const ReservationUnitCount = styled.div`
  font-size: var(--fontsize-body-xl);
  font-weight: 500;
`;

const Button = styled(HDSButton)`
  font-family: var(--font-bold);
  background-color: var(--color-white) !important;
  margin-left: var(--spacing-m);
`;

const InnerContainer = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: flex-end;
  align-items: center;
  color: var(--color-white);
`;

type Props = {
  count: number;
};

const StartApplicationBar = ({ count }: Props): JSX.Element | null => {
  const { t } = useTranslation();
  const router = useRouter();

  if (count === 0) {
    return null;
  }

  return (
    <BackgroundContainer>
      <Container style={{ padding: "var(--spacing-m) var(--spacing-m)" }}>
        <InnerContainer>
          <ReservationUnitCount id="reservationUnitCount">
            {t("shoppingCart.count", { count })}
          </ReservationUnitCount>
          <Button
            id="startApplicationButton"
            variant="supplementary"
            iconRight={<IconArrowRight />}
            onClick={() => {
              router.push(`/intro`);
            }}
          >
            {t("shoppingCart.next")}
          </Button>
        </InnerContainer>
      </Container>
    </BackgroundContainer>
  );
};

export default StartApplicationBar;
