import React from "react";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import { ApplicationRoundStatus } from "common/types/gql-types";
import { useModal } from "@/context/ModalContext";
import InfoBubble from "./InfoBubble";
import StageInfo from "./StageInfo";

interface IProps {
  status: ApplicationRoundStatus;
  name: string;
  reservationPeriodEnd: string;
  className?: string;
}

const Wrapper = styled.div`
  line-height: var(--lineheight-l);
`;

const StyledInfoBubble = styled(InfoBubble)`
  margin-left: var(--spacing-2-xs);
  position: relative;
  top: -2px;
`;

function StatusRecommendation({
  status,
  name,
  reservationPeriodEnd,
  className,
}: IProps): JSX.Element {
  const { t } = useTranslation();
  const { setModalContent } = useModal();

  let activeState: number;
  let modal = true;
  switch (status) {
    case ApplicationRoundStatus.Draft:
      activeState = 1;
      break;
    case ApplicationRoundStatus.InReview:
      activeState = 2;
      break;
    case ApplicationRoundStatus.ReviewDone:
    case "review_done":
      activeState = 3;
      break;
    case ApplicationRoundStatus.Allocated:
      activeState = 4;
      break;
    case ApplicationRoundStatus.Reserving:
      activeState = 5;
      break;
    case ApplicationRoundStatus.Handled:
    case ApplicationRoundStatus.Sending:
      activeState = 6;
      break;
    case ApplicationRoundStatus.Sent:
    case ApplicationRoundStatus.Archived:
      activeState = 7;
      modal = false;
      break;
    default:
  }

  return (
    <Wrapper className={className}>
      {t(`ApplicationRound.recommendations.${status}`)}
      {modal && (
        <StyledInfoBubble
          onClick={() =>
            setModalContent &&
            setModalContent(
              <StageInfo
                activeStage={activeState}
                name={name}
                reservationPeriodEnd={reservationPeriodEnd}
              />
            )
          }
        />
      )}
    </Wrapper>
  );
}

export default StatusRecommendation;
