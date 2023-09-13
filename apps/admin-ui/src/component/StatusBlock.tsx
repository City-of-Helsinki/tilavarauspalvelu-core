import React, { ReactNode } from "react";
import styled from "styled-components";

interface IProps {
  statusStr: string;
  color: string;
  icon?: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

const Wrapper = styled.div<{ $color: string; $hasIcon: boolean }>`
  display: inline-flex;
  align-items: center;
  margin-bottom: var(--spacing-3-xl);
  background-color: ${({ $color }) => $color};
  height: 28px;
  padding: 0 var(--spacing-s);
  color: ${({ $color }) =>
    $color &&
    [
      "var(--color-silver)",
      "var(--color-alert-light)",
      "var(--color-white)",
    ].includes($color)
      ? "var(--color-black-90)"
      : "var(--color-white)"};
  font-size: var(--fontsize-body-s);
  white-space: nowrap;

  ${({ $hasIcon }) =>
    $hasIcon &&
    `
    padding-left: 0;

    svg {
      margin-right: var(--spacing-xs);
    }
  `}
`;

function StatusBlock({
  statusStr,
  color,
  icon,
  className,
  style,
}: IProps): JSX.Element {
  return (
    <Wrapper
      data-testid="status-block__wrapper"
      $color={color}
      $hasIcon={!!icon}
      className={className}
      style={style}
    >
      {icon}
      <span>{statusStr}</span>
    </Wrapper>
  );
}

export default StatusBlock;
