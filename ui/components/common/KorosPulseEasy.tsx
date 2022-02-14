import classNames from "classnames";
import React from "react";
import styled from "styled-components";

type Props = {
  from?: string;
  to?: string;
  className?: string;
};

const Wrapper = styled.div<{ $from: string; $to: string }>`
  margin-bottom: var(--spacing-xl);
  ${({ $from, $to }) => `
    height: 50px;
    background-color: ${$from};
    fill: ${$to};

    pattern {
      fill: ${$to};
    }
  `}
`;

const KorosPulseEasy = ({ from, to, className }: Props): JSX.Element => {
  return (
    <Wrapper
      $from={from}
      $to={to}
      className={classNames("hds-koros", className)}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        width="100%"
        height="50"
        fill="currentColor"
      >
        <defs>
          <pattern
            id="koros-pulse-easy"
            x="0"
            y="0"
            width="67"
            height="50"
            patternUnits="userSpaceOnUse"
          >
            <path d="M 67 63.5 V 35.86 C 50.4 35.74 50.35 13.5 33.65 13.5 S 16.91 35.87 0.17 35.87 H 0 V 63.5 Z" />
          </pattern>
        </defs>
        <rect fill="url(#koros-pulse-easy)" width="100%" height="50" />
      </svg>
    </Wrapper>
  );
};

export default KorosPulseEasy;
