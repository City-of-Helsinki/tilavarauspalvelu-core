import React from "react";
import styled from "styled-components";
import trim from "lodash/trim";
import { describeArc } from "../common/util";

interface IProps {
  status: number;
  x?: number;
  y?: number;
}

const Wrapper = styled.div<{ $width: number; $height: number }>`
  position: relative;
  width: ${({ $width }) => $width && `${$width}px`};
  height: ${({ $height }) => $height && `${$height}px`};
  min-width: ${({ $width }) => $width && `${$width}px`};
  min-height: ${({ $height }) => $height && `${$height}px`};
  display: flex;
  align-items: center;
  justify-content: center;
`;

const Svg = styled.svg`
  display: block;
  width: 100%;
  height: 100%;
`;

const Percent = styled.div<{ $percent: number }>`
  position: absolute;
  text-align: center;
  font-family: var(--tilavaraus-admin-font-bold);
  font-size: ${({ $percent }) =>
    String($percent).length < 3 ? "1.8rem" : "1.4rem"};
  width: 100%;
  margin: 0 0 0 ${({ $percent }) => ($percent < 100 ? "5%" : "2%")};

  span {
    font-size: var(--fontsize-body-m);
    padding-left: var(--spacing-3-xs);
  }
`;

const StatusCircle = ({ status, x = 90, y = 90 }: IProps): JSX.Element => {
  const size = {
    x,
    y,
    minDimension: x > y ? x : y,
  };

  const normalizePercentages = (percentage: number) =>
    percentage > 1 ? 1 : percentage;
  const normalizeAngles = (angle: number) => (angle > 360 ? 360 : angle);

  const statusPercentage = normalizePercentages(status / 100);
  const statusAngles = normalizeAngles(Math.round(statusPercentage * 360));

  const bgColor =
    statusPercentage === 0 ? "var(--color-black-40)" : "var(--color-black-5)";

  const Graph = (
    <Svg>
      <circle
        cx={size.x / 2}
        cy={size.y / 2}
        r={size.minDimension * 0.441}
        strokeWidth={size.minDimension * 0.07}
        fill="none"
        stroke={statusAngles > 359.9 ? "var(--color-success)" : bgColor}
        key="circle"
      />
      {statusAngles > 359.9 ? null : (
        <path
          fill="none"
          stroke="var(--color-success)"
          strokeWidth={size.minDimension * 0.07}
          d={describeArc(
            size.x / 2,
            size.y / 2,
            size.minDimension / 2.27,
            0,
            statusAngles
          )}
          key="full"
        />
      )}
    </Svg>
  );

  const result =
    status > 100 ? status.toFixed(0) : trim(status.toFixed(1), ".0");

  return (
    <Wrapper $width={size.x} $height={size.y}>
      <Percent $percent={Number(result)}>
        {result}
        <span>%</span>
      </Percent>
      {Graph}
    </Wrapper>
  );
};

export default StatusCircle;
