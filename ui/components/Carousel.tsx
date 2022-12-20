import React from "react";
import NukaCarousel from "nuka-carousel";
import { IconAngleLeft, IconAngleRight } from "hds-react";
import styled from "styled-components";
import { breakpoints } from "common/src/common/style";
import { useTranslation } from "react-i18next";
import { MediumButton } from "../styles/util";

type Props = {
  children: React.ReactNode[];
  slidesToShow?: number;
  slidesToScroll?: number;
  cellSpacing?: number;
  wrapAround?: boolean;
  hideCenterControls?: boolean;
  buttonVariant?: "medium" | "small";
};

const Button = styled(MediumButton).attrs({
  style: {
    "--color-bus": "rgba(0,0,0,0.4)",
    "--color-bus-dark": "rgba(0,0,0,0.4)",
    "--border-color": "rgba(0,0,0,0.4)",
    "--border-width": "1px",
    "--min-size": "40px",
    "--outline-gutter": "-2px",
    "--outline-width": "2px",
  } as React.CSSProperties,
})`
  && {
    & > span {
      padding: 0;
    }

    padding: 0;
    border-color: transparent !important;
  }

  button {
    padding: 0;
  }
`;

const SmallArrowButton = styled(Button).attrs({
  "data-testid": "slot-carousel-button",
})<{
  $disabled: boolean;
  $side: "left" | "right";
}>`
  &&& {
    --color-bus: transparent;
    --color-bus-dark: transparent;
    --min-size: 0;

    background-color: var(--color-gold-light);
    margin: 0;
    padding: 0;

    ${({ $disabled }) =>
      $disabled
        ? `
    display: none !important;
  `
        : `
    &:hover {
      opacity: 0.7;
    }
    opacity: 1;
  `};

    svg {
      color: black;
      transform: scale(1.5);
    }

    & > span {
      margin: 0;
      padding: 0;
    }
  }
`;

const MediumArrowButton = styled(Button).attrs({
  "data-testid": "slot-carousel-button",
})<{
  $disabled: boolean;
  $side: "left" | "right";
}>`
  ${({ $disabled }) =>
    $disabled
      ? `
    display: none !important;
  `
      : `
    &:hover {
      opacity: 1;
    }
    opacity: 0.5;
  `};

  @media (min-width: calc(${breakpoints.xl} + 130px)) {
    &:hover {
      opacity: 0.5;
    }

    &:active {
      opacity: 1;
    }

    position: absolute;
    opacity: 1;
    background-color: transparent !important;
    color: var(--color-black-90) !important;
    ${({ $side }) =>
      $side === "left"
        ? `
      left: -70px;
    `
        : `
      left: 70px;
    `}

    svg {
      --icon-size: var(--spacing-2-xl) !important;
    }
  }
`;

const StyledCarousel = styled(NukaCarousel)<{
  children: React.ReactNode;
  $showCenterControls: boolean;
}>`
  width: calc(100% + var(--spacing-xs) * 2) !important;
  height: fit-content !important;
  margin-right: calc(var(--spacing-xs) * -1);
  margin-left: calc(var(--spacing-xs) * -1);

  .slider-control-bottomcenter {
    ${({ $showCenterControls }) => !$showCenterControls && "display: none;"}
    position: relative !important;
    bottom: unset !important;
    left: unset !important;
    transform: unset !important;

    .paging-item {
      button {
        svg {
          transform: scale(1.9);
          border-radius: 50%;
          fill: var(--color-black-20);
        }
      }
    }

    ul {
      gap: var(--spacing-3-xs);
      flex-wrap: wrap;
      width: 100%;
      justify-content: center;
      position: static !important;
    }
  }

  @media (min-width: ${breakpoints.m}) {
    width: 100% !important;
    height: fit-content !important;
    margin: 0 !important;
  }
`;

const Carousel = ({
  children,
  slidesToShow = 1,
  slidesToScroll = 1,
  cellSpacing = 1,
  wrapAround = true,
  hideCenterControls = false,
  buttonVariant = "medium",
  ...rest
}: Props): JSX.Element => {
  const { t } = useTranslation();
  const ButtonVarians = {
    medium: MediumArrowButton,
    small: SmallArrowButton,
  };

  const ButtonComponent = ButtonVarians[buttonVariant];

  return (
    <StyledCarousel
      renderCenterLeftControls={({ currentSlide, previousSlide }) => {
        const isDisabled =
          (!wrapAround && currentSlide === 0) || children.length < 2;
        return (
          <ButtonComponent
            $disabled={isDisabled}
            $side="left"
            type="button"
            onClick={previousSlide}
            aria-label={t("common:prev")}
          >
            <IconAngleLeft aria-label={t("common:prev")} />
          </ButtonComponent>
        );
      }}
      renderCenterRightControls={({
        currentSlide,
        slidesToShow: sts,
        slideCount,
        nextSlide,
      }) => {
        const isDisabled =
          (!wrapAround && currentSlide + sts >= slideCount) ||
          children.length < 2;
        return (
          <ButtonComponent
            $disabled={isDisabled}
            $side="right"
            type="button"
            onClick={nextSlide}
            aria-label={t("common:next")}
          >
            <IconAngleRight aria-label={t("common:next")} />
          </ButtonComponent>
        );
      }}
      wrapAround={wrapAround}
      heightMode="max"
      slidesToShow={slidesToShow}
      slidesToScroll={slidesToScroll}
      cellSpacing={cellSpacing}
      $showCenterControls={
        !hideCenterControls && children?.length > slidesToShow
      }
      {...rest}
    >
      {children}
    </StyledCarousel>
  );
};

export default Carousel;
