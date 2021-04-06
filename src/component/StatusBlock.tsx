import React from "react";
import styled from "styled-components";

interface IProps {
  statusStr: string;
  color: string;
  className?: string;
}

const Wrapper = styled.div<{ $color: string }>`
  display: inline-flex;
  align-items: center;
  margin-bottom: var(--spacing-3-xl);
  background-color: ${({ $color }) => $color};
  height: 28px;
  padding: 0 15px;
  color: ${({ $color }) =>
    $color &&
    ["var(--color-silver)", "var(--color-alert-light)"].includes($color)
      ? "var(--color-black-90)"
      : "var(--color-white)"};
  font-family: var(--tilavaraus-admin-font-bold);
  font-weight: bold;
  font-size: var(--fontsize-body-s);
  white-space: nowrap;
`;

function StatusBlock({ statusStr, color, className }: IProps): JSX.Element {
  return (
    <Wrapper
      data-testid="status-block__wrapper"
      $color={color}
      className={className}
    >
      <span>{statusStr}</span>
    </Wrapper>
  );
}

export default StatusBlock;
