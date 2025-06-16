import React, { forwardRef, type Ref } from "react";
import NukaCarousel from "nuka-carousel";
import { IconAngleLeft, IconAngleRight, IconSize } from "hds-react";
import styled from "styled-components";
import { useTranslation } from "next-i18next";
import { focusStyles } from "common/styled";

type Props = {
  children: React.ReactNode[];
  slidesToShow?: number;
  slidesToScroll?: number;
  cellSpacing?: number;
  wrapAround?: boolean;
  hideCenterControls?: boolean;
  controlAriaLabel?: string;
  slideIndex?: number;
  frameAriaLabel?: string;
};

const SmallArrowButton = styled.button`
  background-color: transparent;
  border: none;
  margin: 0;
  padding: 0;
  border-radius: 0;

  &:hover {
    opacity: 0.5;
  }
  &:disabled {
    opacity: 0.1;
  }
  ${focusStyles}
`;

const StyledCarousel = styled(NukaCarousel)<{
  children: React.ReactNode;
}>`
  /* hack otherwise the carousel spans over 100%, probably related to children being a grid */
  max-width: calc(100vw - var(--spacing-m) * 4);

  &&& {
    /* Make room for the Carousel controls */
    margin: 0 auto !important;
    width: calc(100% - 60px) !important;
  }
`;

const CustomBottomControls = styled.div`
  position: absolute;
  bottom: 5px;
  left: 50%;
  transform: translateX(-50%);

  ul {
    position: relative;
    top: -10px;
    display: flex;
    margin: 0;
    padding: 0 var(--spacing-3-xs);
    list-style-type: none;
    background: rgb(0, 0, 0, 0.3);
    border-radius: var(--spacing-xs);

    li {
      button {
        cursor: pointer;
        background: transparent;
        border: none;
        fill: white;
        opacity: 0.7;
        &:hover {
          opacity: 1;
        }
      }
      &.active button {
        fill: var(--color-bus);
      }
    }
  }
`;

const Carousel = forwardRef(function Carousel(
  {
    children,
    slidesToShow = 1,
    slidesToScroll = 1,
    cellSpacing = 1,
    wrapAround = true,
    hideCenterControls = false,
    controlAriaLabel = "",
    ...rest
  }: Readonly<Props>,
  ref: Ref<HTMLDivElement>
): JSX.Element {
  const { t } = useTranslation();

  return (
    <StyledCarousel
      ref={ref}
      renderCenterLeftControls={({ previousSlide, previousDisabled }) => (
        <SmallArrowButton
          disabled={previousDisabled}
          type="button"
          onClick={previousSlide}
          aria-label={t("common:prev")}
          data-testid="slot-carousel-button"
        >
          <IconAngleLeft size={IconSize.Medium} aria-hidden="true" />
        </SmallArrowButton>
      )}
      renderCenterRightControls={({ nextSlide, nextDisabled }) => (
        <SmallArrowButton
          disabled={nextDisabled}
          type="button"
          onClick={nextSlide}
          aria-label={t("common:next")}
          data-testid="slot-carousel-button"
        >
          <IconAngleRight size={IconSize.Medium} aria-hidden="true" />
        </SmallArrowButton>
      )}
      renderBottomCenterControls={({ slideCount, currentSlide, goToSlide }) => (
        <CustomBottomControls>
          <ul>
            {[...Array(slideCount)].map((key, idx) => (
              <li key={key} className={currentSlide === idx ? "active" : undefined}>
                <button type="button" aria-label={`${controlAriaLabel} #${idx + 1}`} onClick={() => goToSlide(idx)}>
                  <svg width="12" height="12">
                    <circle cx="5" cy="5" r="5" />
                  </svg>
                </button>
              </li>
            ))}
          </ul>
        </CustomBottomControls>
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
});

export default Carousel;
