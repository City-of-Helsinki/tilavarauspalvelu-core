import React from "react";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import { useModal } from "../../context/ModalContext";
import InfoBubble from "../InfoBubble";
import StageInfo from "../recurring-reservations/StageInfo";
import { ApplicationRound } from "../../common/types";

interface IProps {
  status: string;
  applicationRound: ApplicationRound;
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
  applicationRound,
  className,
}: IProps): JSX.Element {
  const { t } = useTranslation();
  const { setModalContent } = useModal();

  let activeState: number;
  let modal = true;
  switch (status) {
    case "in_review":
      activeState = 2;
      break;
    case "review_done":
      activeState = 3;
      break;
    case "allocated":
      activeState = 4;
      break;
    case "approvalPreparation":
      activeState = 5;
      break;
    case "approval":
      activeState = 6;
      break;
    case "supervisorApproval":
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
                applicationRound={applicationRound}
              />
            )
          }
        />
      )}
    </Wrapper>
  );
}

export default StatusRecommendation;
