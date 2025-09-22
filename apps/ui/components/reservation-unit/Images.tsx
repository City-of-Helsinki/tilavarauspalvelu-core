import React, { useRef, useState } from "react";
import { useTranslation } from "next-i18next";
import styled from "styled-components";
import { breakpoints } from "common/src/const";
import type { ImageFragment } from "@gql/gql-types";
import { Carousel } from "@/components/Carousel";
import { getImageSource } from "common/src/helpers";
import { Dialog } from "hds-react";
import { focusStyles, removeButtonStyles } from "common/styled";
import { FixedDialog } from "@/styled/FixedDialog";

type Props = {
  images: ReadonlyArray<ImageFragment>;
  contextName?: string;
};

const CarouselImage = styled.img`
  width: 100%;
  max-height: 300px;
  object-fit: cover;
  cursor: pointer;

  @media (max-width: ${breakpoints.l}) {
    max-height: 200px;
  }
`;

const ThumbnailImage = styled.img`
  object-fit: cover;
  width: 122px;
  height: 122px;
`;

const ThumbnailButton = styled.button`
  &:hover {
    cursor: pointer;
    opacity: 0.8;
  }
  ${removeButtonStyles}
  ${focusStyles}
`;

const ModalImages = styled.div`
  display: flex;
  max-width: 100%;
  overflow-x: auto;
  gap: var(--spacing-xs);
  /* padding is necessary for focus effect to work */
  padding: var(--spacing-3-xs);
`;

const LargeImage = styled.img`
  max-width: 100%;
`;

export function Images({ images, contextName }: Props): JSX.Element {
  const { t } = useTranslation();
  const ref = useRef<HTMLDivElement>(null);
  const [showModal, setShowModal] = useState(false);
  const [currentImage, setCurrentImage] = useState<ImageFragment>();

  const handleShowModal = (image: ImageFragment) => {
    setCurrentImage(image);
    setShowModal(true);
  };

  if (images.length === 0) {
    return <div />;
  }

  const label = t("common:imgAltForSpace", { name: contextName });
  return (
    <>
      <Carousel controlAriaLabel={label} ref={ref}>
        {images.map((image, index) => (
          <CarouselImage
            tabIndex={0}
            key={image.imageUrl}
            alt={`${t("common:imgAltForSpace", { name: contextName })} #${index + 1}`}
            src={getImageSource(image, "large")}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleShowModal(image);
              }
            }}
            onClick={() => handleShowModal(image)}
            aria-label={`${t("common:imgAltForSpace", {
              name: contextName,
            })} #${index + 1}`}
          />
        ))}
      </Carousel>
      <FixedDialog
        id="reservation-unit-images-modal"
        close={() => setShowModal(false)}
        isOpen={showModal}
        focusAfterCloseRef={ref}
        closeButtonLabelText={t("common:close")}
        aria-labelledby="modal-header"
      >
        <Dialog.Header id="modal-header" title={label} />
        <Dialog.Content>
          {currentImage ? (
            <LargeImage alt={t("common:imgAltForSpace")} src={getImageSource(currentImage, "large")} />
          ) : null}
          <ModalImages>
            {images?.map((image) => (
              <ThumbnailButton
                key={image.imageUrl}
                type="button"
                onClick={() => {
                  setCurrentImage(image);
                }}
              >
                <ThumbnailImage alt={t("common:imgAltForSpace")} src={getImageSource(image, "small")} />
              </ThumbnailButton>
            ))}
          </ModalImages>
        </Dialog.Content>
      </FixedDialog>
    </>
  );
}
