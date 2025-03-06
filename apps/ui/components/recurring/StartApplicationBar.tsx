import {
  ButtonSize,
  ButtonVariant,
  IconArrowRight,
  IconCross,
} from "hds-react";
import React from "react";
import { useTranslation } from "next-i18next";
import styled from "styled-components";
import { breakpoints } from "common/src/common/style";
import { useRouter } from "next/router";
import {
  type ApplicationCreateMutationInput,
  ReservationUnitNode,
  useCreateApplicationMutation,
} from "@/gql/gql-types";
import { getApplicationPath } from "@/modules/urls";
import { Flex, NoWrap, WhiteButton } from "common/styles/util";
import { useMedia } from "react-use";
import { ignoreMaybeArray, toNumber } from "common/src/helpers";
import { useDisplayError } from "@/hooks/useDisplayError";
import { useReservationUnitList } from "@/hooks";
import { useSearchParams } from "next/navigation";
import { pageSideMargins } from "common/styles/layout";
import { LoginFragment } from "../LoginFragment";
import { getPostLoginUrl } from "@/modules/util";

const BackgroundContainer = styled.div`
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  z-index: var(--tilavaraus-stack-order-start-application-bar);

  background-color: var(--color-bus);
  color: var(--color-white);
`;

const InnerContainer = styled(Flex).attrs({
  $direction: "row",
  $alignItems: "center",
  $wrap: "wrap",
})`
  ${pageSideMargins}
  margin: 0 auto;
  padding-bottom: var(--spacing-s);
  padding-top: var(--spacing-s);

  /* three div layout */
  & > :last-child {
    margin-left: auto;
  }

  gap: var(--spacing-xs);
  @media (min-width: ${breakpoints.m}) {
    gap: var(--spacing-l);
  }
`;

type NodeList = Pick<ReservationUnitNode, "pk">[];
type Props = {
  applicationRound: {
    reservationUnits: NodeList;
  };
  apiBaseUrl: string;
};

export function StartApplicationBar({
  apiBaseUrl,
  applicationRound,
}: Props): JSX.Element | null {
  const { t } = useTranslation();
  const router = useRouter();
  const isMobile = useMedia(`(max-width: ${breakpoints.m})`, false);

  const { getReservationUnits, clearSelections, PARAM_NAME } =
    useReservationUnitList(applicationRound);
  const searchValues = useSearchParams();

  const [create, { loading: isSaving }] = useCreateApplicationMutation();

  const displayError = useDisplayError();
  const createNewApplication = async (applicationRoundPk: number) => {
    const input: ApplicationCreateMutationInput = {
      applicationRound: applicationRoundPk,
    };
    try {
      const { data } = await create({
        variables: { input },
      });

      if (data?.createApplication?.pk) {
        const { pk } = data.createApplication;
        const selected = searchValues.getAll(PARAM_NAME);
        const forwardParams = new URLSearchParams();
        for (const s of selected) {
          forwardParams.append(PARAM_NAME, s);
        }
        const url = `${getApplicationPath(pk, "page1")}?${forwardParams.toString()}`;
        router.replace(url);
      } else {
        throw new Error("create application mutation failed");
      }
    } catch (e) {
      displayError(e);
    }
  };

  const onNext = () => {
    const applicationRoundPk = toNumber(ignoreMaybeArray(router.query.id));
    if (applicationRoundPk) {
      createNewApplication(applicationRoundPk);
    } else {
      throw new Error("Application round id is missing");
    }
  };

  const count = getReservationUnits().length;
  // This breaks SSR because the server knowns nothing about client side stores
  // we can't fix it with CSS since it doesn't update properly
  if (count === 0) {
    return null;
  }

  return (
    <BackgroundContainer>
      <InnerContainer>
        <NoWrap id="reservationUnitCount">
          {isMobile
            ? t("shoppingCart:countShort", { count })
            : t("shoppingCart:count", { count })}
        </NoWrap>
        <WhiteButton
          onClick={clearSelections}
          size={ButtonSize.Small}
          data-testid="start-application-bar__button--clear-selections"
          variant={ButtonVariant.Supplementary}
          iconStart={<IconCross />}
          colorVariant="light"
        >
          {isMobile
            ? t("shoppingCart:deleteSelectionsShort")
            : t("shoppingCart:deleteSelections")}
        </WhiteButton>
        <LoginFragment
          returnUrl={getPostLoginUrl()}
          apiBaseUrl={apiBaseUrl}
          componentIfAuthenticated={
            <WhiteButton
              id="startApplicationButton"
              variant={ButtonVariant.Supplementary}
              size={ButtonSize.Small}
              onClick={onNext}
              disabled={isSaving}
              iconEnd={<IconArrowRight />}
              colorVariant="light"
            >
              {t("shoppingCart:nextShort")}
            </WhiteButton>
          }
        />
      </InnerContainer>
    </BackgroundContainer>
  );
}
