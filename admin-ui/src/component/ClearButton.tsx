import React from "react";
import { IconCrossCircleFill } from "hds-react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";

interface Props {
  onClick: () => void;
  disabled?: boolean;
  ariaLabel?: string;
}

const StyledButton = styled.button`
  width: var(--spacing-layout-xs);
  height: var(--spacing-layout-xs);
  padding: 0;
  border: 0;
  background-color: transparent;
  position: absolute;
  right: var(--spacing-2-xs);
`;

const ResetIcon = styled(IconCrossCircleFill)`
  &:hover {
    opacity: 0.7;
  }

  color: var(--color-black-50);
`;

const ClearButton = ({ onClick, disabled, ariaLabel }: Props): JSX.Element => {
  const { t } = useTranslation();

  return (
    <StyledButton
      onClick={onClick}
      aria-label={ariaLabel || t("common.resetSearch")}
      disabled={disabled}
    >
      <ResetIcon />
    </StyledButton>
  );
};

export default ClearButton;
