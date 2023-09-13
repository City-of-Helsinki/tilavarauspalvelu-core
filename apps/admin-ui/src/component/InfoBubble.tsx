import React from "react";
import styled from "styled-components";

interface IProps {
  onClick: () => void;
  className?: string;
}

const Bubble = styled.div`
  background-color: var(--tilavaraus-admin-blue);
  border-radius: 50%;
  width: 16px;
  min-width: 16px;
  height: 16px;
  user-select: none;
  cursor: pointer;
  color: white;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-family: var(--tilavaraus-admin-font-bold);
  font-weight: bold;
`;

function InfoBubble({ className, onClick }: IProps): JSX.Element {
  return (
    <Bubble onClick={onClick} className={className}>
      i
    </Bubble>
  );
}

export default InfoBubble;
