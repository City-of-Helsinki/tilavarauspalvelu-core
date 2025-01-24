import {
  Button,
  ButtonSize,
  ButtonVariant,
  IconArrowRight,
  IconCross,
} from "hds-react";
import React from "react";
import { useTranslation } from "next-i18next";
import styled from "styled-components";
import { breakpoints } from "common/src/common/style";
import ClientOnly from "common/src/ClientOnly";
import { useRouter } from "next/router";
import {
  ApplicationCreateMutationInput,
  useCreateApplicationMutation,
} from "@/gql/gql-types";
import { errorToast } from "common/src/common/toast";
import { getApplicationPath } from "@/modules/urls";
import { Flex, NoWrap } from "common/styles/util";
import { truncatedText } from "common/styles/cssFragments";
import { useMedia } from "react-use";

type Props = {
  count: number;
  clearSelections: () => void;
};

const BackgroundContainer = styled.div`
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  z-index: var(--tilavaraus-stack-order-start-application-bar);

  background-color: var(--color-bus);
  color: var(--color-white);

  padding: var(--spacing-m) var(--spacing-m);
  box-sizing: border-box;
`;

const InnerContainer = styled(Flex).attrs({
  $direction: "row",
  $alignItems: "center",
  $wrap: "wrap",
})`
  max-width: var(--tilavaraus-page-max-width);
  width: 100%;
  margin: 0 auto;

  /* three div layout */
  & > :last-child {
    margin-left: auto;
  }

  gap: var(--spacing-2-xs);
  @media (min-width: ${breakpoints.m}) {
    gap: var(--spacing-l);
  }
`;

const DeleteButton = styled(Button).attrs({
  variant: ButtonVariant.Primary,
  iconStart: <IconCross aria-hidden="true" />,
})`
  ${truncatedText}
`;

function StartApplicationBar({
  count,
  clearSelections,
}: Props): JSX.Element | null {
  const { t } = useTranslation();
  const router = useRouter();
  const isMobile = useMedia(`(max-width: ${breakpoints.m})`, false);

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
      <InnerContainer>
        <div>
          <NoWrap id="reservationUnitCount">
            {isMobile
              ? t("shoppingCart:countShort", { count })
              : t("shoppingCart:count", { count })}
          </NoWrap>
        </div>
        <DeleteButton
          onClick={clearSelections}
          size={ButtonSize.Small}
          data-testid="start-application-bar__button--clear-selections"
        >
          {isMobile
            ? t("shoppingCart:deleteSelectionsShort")
            : t("shoppingCart:deleteSelections")}
        </DeleteButton>
        <Button
          id="startApplicationButton"
          onClick={onNext}
          disabled={isSaving}
          iconEnd={<IconArrowRight aria-hidden="true" />}
        >
          {isMobile ? t("shoppingCart:nextShort") : t("shoppingCart:next")}
        </Button>
      </InnerContainer>
    </BackgroundContainer>
  );
}

const StartApplicationBarWrapped = (props: Props) => (
  <ClientOnly>
    <StartApplicationBar {...props} />
  </ClientOnly>
);

export default StartApplicationBarWrapped;
