import { Button, IconArrowRight, IconCross } from "hds-react";
import React from "react";
import { useTranslation } from "next-i18next";
import styled from "styled-components";
import { breakpoints } from "common/src/common/style";
import { Container as CommonContainer } from "common";
import ClientOnly from "common/src/ClientOnly";
import { JustForDesktop, JustForMobile } from "@/modules/style/layout";
import { truncatedText } from "@/styles/util";
import { useRouter } from "next/router";
import {
  ApplicationCreateMutationInput,
  useCreateApplicationMutation,
} from "@/gql/gql-types";
import { errorToast } from "common/src/common/toast";
import { getApplicationPath } from "@/modules/urls";

type Props = {
  count: number;
  clearSelections: () => void;
};

const BackgroundContainer = styled.div`
  background-color: var(--color-bus);
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  z-index: 20;
  min-width: ${breakpoints.xs};
`;

const Container = styled(CommonContainer)`
  padding: var(--spacing-m) var(--spacing-m);
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
})`
  ${truncatedText}
`;

function StartApplicationBar({
  count,
  clearSelections,
}: Props): JSX.Element | null {
  const { t } = useTranslation();
  const router = useRouter();

  const [create, { loading: isSaving }] = useCreateApplicationMutation();

  const createNewApplication = async (applicationRoundId: number) => {
    const input: ApplicationCreateMutationInput = {
      applicationRound: applicationRoundId,
    };
    try {
      const { data } = await create({
        variables: { input },
      });

      if (data?.createApplication?.pk) {
        const { pk } = data.createApplication;
        router.replace(getApplicationPath(pk, "page1"));
      } else {
        throw new Error("create application mutation failed");
      }
    } catch (e) {
      errorToast({ text: t("application:Intro.createFailedContent") });
    }
  };

  const onNext = () => {
    const applicationRoundId = router.query.id;
    if (typeof applicationRoundId === "string" && applicationRoundId !== "") {
      createNewApplication(Number(applicationRoundId));
    } else {
      throw new Error("Application round id is missing");
    }
  };

  // This breaks SSR because the server knowns nothing about client side stores
  // we can't fix it with CSS since it doesn't update properly
  if (count === 0) {
    return null;
  }

  return (
    <BackgroundContainer>
      <Container>
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
            <DeleteButton
              onClick={clearSelections}
              size="small"
              data-testid="start-application-bar__button--clear-selections"
            >
              <JustForDesktop>
                {t("shoppingCart:deleteSelections")}
              </JustForDesktop>
              <JustForMobile>
                {t("shoppingCart:deleteSelectionsShort")}
              </JustForMobile>
            </DeleteButton>
          </Left>
          <Button
            id="startApplicationButton"
            onClick={onNext}
            disabled={isSaving}
            iconRight={<IconArrowRight />}
          >
            <JustForDesktop>{t("shoppingCart:next")}</JustForDesktop>
            <JustForMobile>{t("shoppingCart:nextShort")}</JustForMobile>
          </Button>
        </InnerContainer>
      </Container>
    </BackgroundContainer>
  );
}

const StartApplicationBarWrapped = (props: Props) => (
  <ClientOnly>
    <StartApplicationBar {...props} />
  </ClientOnly>
);

export default StartApplicationBarWrapped;
