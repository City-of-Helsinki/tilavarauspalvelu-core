import React from "react";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import { useModal } from "../../context/UIContext";
import InfoBubble from "../InfoBubble";

interface IProps {
  status: string;
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

function StatusRecommendation({ status, className }: IProps): JSX.Element {
  const { t } = useTranslation();
  const { setModalContent } = useModal();

  return (
    <Wrapper className={className}>
      {t(`ApplicationRound.recommendations.${status}`)}
      <StyledInfoBubble
        onClick={() =>
          setModalContent && setModalContent(<div>modal content</div>)
        }
      />
    </Wrapper>
  );
}

export default StatusRecommendation;
