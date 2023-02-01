import { Button, IconArrowRight, IconCross } from "hds-react";
import React from "react";
import { useTranslation } from "next-i18next";
import { useRouter } from "next/router";
import styled from "styled-components";
import { breakpoints } from "common/src/common/style";
import Container from "./Container";
import { JustForDesktop, JustForMobile } from "../../modules/style/layout";

type Props = {
  count: number;
  clearSelections: () => void;
};

const BackgroundContainer = styled.div`
  background-color: var(--color-bus);
  position: fixed;
  bottom: 0;
  width: 100%;
  z-index: 20;
  min-width: ${breakpoints.xs};
`;

const CountWrapper = styled.div`
  position: relative;
  width: 20px;
  height: 18px;

  @media (min-width: ${breakpoints.m}) {
    width: 100px;
  }
`;

const ReservationUnitCount = styled.div`
  font-size: var(--fontsize-body-m);
  position: absolute;
  top: 0;
  right: 0;
  white-space: nowrap;
`;

const InnerContainer = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  gap: var(--spacing-2-xs);
  align-items: center;
  color: var(--color-white);
  padding-left: var(--spacing-m);

  @media (min-width: ${breakpoints.m}) {
    gap: var(--spacing-l);
  }
`;

const Left = styled.div`
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);

  @media (min-width: ${breakpoints.m}) {
    gap: var(--spacing-3-xl);
  }
`;

const DeleteButton = styled(Button).attrs({
  variant: "primary",
  iconLeft: <IconCross />,
  // eslint-disable-next-line @typescript-eslint/naming-convention
  "data-testid": "start-application-bar__button--clear-selections",
})``;

const SubmitButton = styled(Button)`
  background-color: var(--color-white);
  color: var(--color-bus);
`;

const StartApplicationBar = ({
  count,
  clearSelections,
}: Props): JSX.Element | null => {
  const { t } = useTranslation();
  const router = useRouter();

  if (count === 0) {
    return null;
  }

  return (
    <BackgroundContainer>
      <Container style={{ padding: "var(--spacing-m) var(--spacing-m)" }}>
        <InnerContainer>
          <Left>
            <CountWrapper>
              <ReservationUnitCount id="reservationUnitCount">
                <JustForDesktop>
                  {t("shoppingCart:count", { count })}
                </JustForDesktop>
                <JustForMobile>
                  {t("shoppingCart:countShort", { count })}
                </JustForMobile>
              </ReservationUnitCount>
            </CountWrapper>
            <DeleteButton onClick={clearSelections} size="small">
              <JustForDesktop>
                {t("shoppingCart:deleteSelections")}
              </JustForDesktop>
              <JustForMobile>
                {t("shoppingCart:deleteSelectionsShort")}
              </JustForMobile>
            </DeleteButton>
          </Left>
          <SubmitButton
            id="startApplicationButton"
            variant="primary"
            iconRight={<IconArrowRight />}
            onClick={() => {
              router.push(`/intro`);
            }}
          >
            <JustForDesktop>{t("shoppingCart:next")}</JustForDesktop>
            <JustForMobile>{t("shoppingCart:nextShort")}</JustForMobile>
          </SubmitButton>
        </InnerContainer>
      </Container>
    </BackgroundContainer>
  );
};

export default StartApplicationBar;
