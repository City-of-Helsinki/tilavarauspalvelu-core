import React from "react";
import NukaCarousel from "nuka-carousel";
import { IconAngleLeft, IconAngleRight } from "hds-react";
import styled from "styled-components";
import { breakpoints } from "common/src/common/style";
import { useTranslation } from "next-i18next";
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
  /* eslint-disable @typescript-eslint/naming-convention */
  style: {
    "--color-bus": "rgba(0,0,0,0.4)",
    "--color-bus-dark": "rgba(0,0,0,0.4)",
    "--border-color": "rgba(0,0,0,0.4)",
    "--border-width": "1px",
    "--min-size": "40px",
    "--outline-gutter": "-2px",
    "--outline-width": "2px",
  } as React.CSSProperties,
  /* eslint-enable */
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
  // eslint-disable-next-line @typescript-eslint/naming-convention
  "data-testid": "slot-carousel-button",
})<{
  $disabled: boolean;
}>`
  &&& {
    --color-bus: transparent;
    --color-bus-dark: transparent;
    --min-size: 0;

    background-color: transparent;
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
  }
`;

const MediumArrowButton = styled(Button).attrs({
  // eslint-disable-next-line @typescript-eslint/naming-convention
  "data-testid": "slot-carousel-button",
})<{
  $disabled: boolean;
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

  @media (width > calc(${breakpoints.xl} + 130px)) {
    &:hover {
      opacity: 0.5;
    }

    &:active {
      opacity: 1;
    }

    opacity: 1;
    background-color: transparent !important;
    color: var(--color-black-90) !important;

    svg {
      --icon-size: var(--spacing-2-xl) !important;
    }
  }
`;

const StyledCarousel = styled(NukaCarousel)<{
  children: React.ReactNode;
}>`
  width: calc(100% + var(--spacing-xs) * 2) !important;
  height: fit-content !important;
  margin-right: calc(var(--spacing-xs) * -1);
  margin-left: calc(var(--spacing-xs) * -1);

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
  const ButtonVariants = {
    medium: MediumArrowButton,
    small: SmallArrowButton,
  };

  const ButtonComponent = ButtonVariants[buttonVariant];

  return (
    <StyledCarousel
      renderCenterLeftControls={({ previousSlide, previousDisabled }) => (
        <ButtonComponent
          $disabled={previousDisabled}
          type="button"
          onClick={previousSlide}
          aria-label={t("common:prev")}
        >
          <IconAngleLeft aria-label={t("common:prev")} />
        </ButtonComponent>
      )}
      renderCenterRightControls={({ nextSlide, nextDisabled }) => (
        <ButtonComponent
          $disabled={nextDisabled}
          type="button"
          onClick={nextSlide}
          aria-label={t("common:next")}
        >
          <IconAngleRight aria-label={t("common:next")} />
        </ButtonComponent>
      )}
      wrapAround={wrapAround}
      slidesToShow={slidesToShow}
      slidesToScroll={slidesToScroll}
      cellSpacing={cellSpacing}
      withoutControls={children?.length <= slidesToShow}
      {...(hideCenterControls && {
        renderBottomCenterControls: () => null,
      })}
      dragging={children?.length > slidesToShow}
      {...rest}
    >
      {children}
    </StyledCarousel>
  );
};

export default Carousel;
