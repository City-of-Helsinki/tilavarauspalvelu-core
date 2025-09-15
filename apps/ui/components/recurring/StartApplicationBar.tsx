import { ButtonSize, ButtonVariant, IconArrowRight, IconCross } from "hds-react";
import React from "react";
import { useTranslation } from "next-i18next";
import styled from "styled-components";
import { useRouter } from "next/router";
import { type ApplicationCreateMutation, ReservationUnitNode, useCreateApplicationMutation } from "@/gql/gql-types";
import { getApplicationPath } from "@/modules/urls";
import { Flex, NoWrap, WhiteButton, pageSideMargins } from "common/styled";
import { breakpoints } from "common/src/const";
import { useMedia } from "react-use";
import { ignoreMaybeArray, toNumber } from "common/src/helpers";
import { useDisplayError } from "common/src/hooks";
import { useReservationUnitList } from "@/hooks";
import { useSearchParams } from "next/navigation";
import { LoginFragment } from "../LoginFragment";
import { getPostLoginUrl } from "@/modules/util";
import { isBrowser } from "@/modules/const";

const SpaceWrapper = styled.div`
  height: 76px;
`;

const InnerContainer = styled(Flex).attrs({
  $direction: "row",
  $alignItems: "center",
  $wrap: "wrap",
})`
  margin: 0 auto;
  padding-bottom: var(--spacing-s);
  padding-top: var(--spacing-s);
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  z-index: var(--tilavaraus-stack-order-start-application-bar);
  background-color: var(--color-bus);
  color: var(--color-white);
  ${pageSideMargins}

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
    reservationUnits: Readonly<NodeList>;
  };
  apiBaseUrl: string;
};

export function StartApplicationBar({ apiBaseUrl, applicationRound }: Readonly<Props>): JSX.Element {
  const { t } = useTranslation();
  const router = useRouter();
  const isMobile = useMedia(`(max-width: ${breakpoints.m})`, false);
  let bottomOffset = 0;
  if (isBrowser) {
    bottomOffset =
      (document?.querySelector(".hds-cc__target")?.shadowRoot?.querySelector(".hds-cc__container")?.clientHeight ??
        -8) + 8; // CC-border width is 8px, which isn't included in clientHeight. If it's undefined, use -8 to nullify the result
  }
  const { getReservationUnits, clearSelections, PARAM_NAME } = useReservationUnitList(applicationRound);
  const searchValues = useSearchParams();

  const [create, { loading: isSaving }] = useCreateApplicationMutation();

  const displayError = useDisplayError();
  const createNewApplication = async (applicationRoundPk: number) => {
    const input: ApplicationCreateMutation = {
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
    } catch (err) {
      displayError(err);
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

  return (
    <SpaceWrapper aria-live="polite">
      {count > 0 && (
        <InnerContainer style={{ bottom: bottomOffset + "px" }}>
          <NoWrap id="reservationUnitCount">
            {isMobile ? t("shoppingCart:countShort", { count }) : t("shoppingCart:count", { count })}
          </NoWrap>
          <WhiteButton
            onClick={clearSelections}
            size={ButtonSize.Small}
            data-testid="start-application-bar__button--clear-selections"
            variant={ButtonVariant.Supplementary}
            iconStart={<IconCross />}
            $colorVariant="light"
          >
            {isMobile ? t("shoppingCart:deleteSelectionsShort") : t("shoppingCart:deleteSelections")}
          </WhiteButton>
          <LoginFragment
            returnUrl={getPostLoginUrl()}
            apiBaseUrl={apiBaseUrl}
            type="application"
            componentIfAuthenticated={
              <WhiteButton
                id="startApplicationButton"
                variant={ButtonVariant.Supplementary}
                size={ButtonSize.Small}
                onClick={onNext}
                disabled={isSaving}
                iconEnd={<IconArrowRight />}
                $colorVariant="light"
              >
                {t("shoppingCart:nextShort")}
              </WhiteButton>
            }
          />
        </InnerContainer>
      )}
    </SpaceWrapper>
  );
}
