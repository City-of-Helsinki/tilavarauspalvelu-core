import React from "react";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import { ApplicationRoundStatusChoice } from "common/types/gql-types";
import { useModal } from "@/context/ModalContext";
import InfoBubble from "./InfoBubble";
import StageInfo from "./StageInfo";

interface IProps {
  status: ApplicationRoundStatusChoice;
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

  // FIXME this changes some status styling with 1 - 7 values
  // it should be an enum / literal and the states are completely changed from old REST API
  // we can push the GQL status enum directly to the component
  const activeState = 1;
  const modal = true;
  /*
  switch (status) {
    case ApplicationRoundStatusChoice.Draft:
      activeState = 1;
      break;
    case ApplicationRoundStatusChoice.InReview:
      activeState = 2;
      break;
    case ApplicationRoundStatusChoice.ReviewDone:
      activeState = 3;
      break;
    case ApplicationRoundStatusChoice.Allocated:
      activeState = 4;
      break;
    case ApplicationRoundStatusChoice.Reserving:
      activeState = 5;
      break;
    case ApplicationRoundStatusChoice.Handled:
    case ApplicationRoundStatusChoice.Sending:
      activeState = 6;
      break;
    case ApplicationRoundStatusChoice.Sent:
    case ApplicationRoundStatusChoice.Archived:
      activeState = 7;
      modal = false;
      break;
    default:
  }
  */

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
