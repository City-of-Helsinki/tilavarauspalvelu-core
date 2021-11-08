import { IconCheck, IconCross } from "hds-react";
import React, { ReactNode } from "react";
import styled from "styled-components";
import { fontMedium } from "../modules/style/typography";

type Step = {
  label: string;
  error?: boolean;
};

export type StepperHzProps = {
  steps: Step[];
  active?: number;
  bgColor?: string;
};

type StepState = "active" | "inactive" | "error" | "done";

const Wrapper = styled.div<{ $percentDone: number }>`
  &:before {
    content: "";
    position: absolute;
    top: calc(50% - 1px);
    left: 40px;
    width: calc(100% - 40px);
    height: 2px;
    ${({ $percentDone }) => `
      background: linear-gradient(
        to right,
        var(--color-bus) 0%,
        var(--color-bus) ${$percentDone}%,
        var(--color-black-20) ${$percentDone}%,
        var(--color-black-20) 100%
      );
    `}
    z-index: -1;
  }

  display: flex;
  justify-content: space-between;
  position: relative;
`;

const Rim = styled.div<{ $bgColor: string }>`
  border: 2px solid ${({ $bgColor }) => $bgColor};
  border-radius: 50%;
`;

const Step = styled.div<{ $state: StepState; $bgColor: string }>`
  ${fontMedium};
  border: 2px solid
    ${({ $state }) => {
      switch ($state) {
        case "active":
        case "done":
          return "var(--color-bus)";
        case "error":
          return "var(--color-error)";
        case "inactive":
        default:
          return "var(--color-black-20)";
      }
    }};
  color: ${({ $state }) => {
    switch ($state) {
      case "active":
        return "var(--color-bus)";
      case "done":
        return "var(--color-white)";
      case "error":
        return "var(--color-error)";
      case "inactive":
      default:
        return "var(--color-black-40)";
    }
  }};
  background-color: ${({ $state, $bgColor }) => {
    switch ($state) {
      case "done":
        return "var(--color-bus)";
      default:
        return $bgColor;
    }
  }};
  position: relative;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const StepperHz = ({
  steps,
  active,
  bgColor = "var(--color-white)",
}: StepperHzProps): JSX.Element => {
  const percentDone =
    steps.length - 1 === active
      ? 100
      : active === 0
      ? 0
      : ((active + 1) / (steps.length + 1)) * 100;

  return (
    <Wrapper $percentDone={percentDone} aria-hidden>
      {steps.map((step, index) => {
        const numberLabel = step.label || (index + 1).toString();
        let label: string | ReactNode = numberLabel;
        let state: StepState;
        if (step.error) {
          state = "error";
          label = <IconCross />;
        } else if (active === index) {
          state = "active";
        } else if (active < index) {
          state = "inactive";
        } else {
          state = "done";
          label = <IconCheck />;
        }
        return (
          <Rim
            key={step.label}
            $bgColor={bgColor}
            data-testid="step"
            data-state={state}
          >
            <Step $state={state} $bgColor={bgColor}>
              {label}
            </Step>
          </Rim>
        );
      })}
    </Wrapper>
  );
};

export default StepperHz;
