import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import dynamic from "next/dynamic";
import { breakpoint } from "../../modules/style";
import Carousel from "../Carousel";
import { pixel } from "../../styles/util";
import { ReservationUnitImageType } from "../../modules/gql-types";

const Modal = dynamic(() => import("../common/Modal"));
type Props = {
  images: ReservationUnitImageType[];
  contextName?: string;
};

const StyledCarousel = styled(Carousel)`
  order: -1;
  margin-bottom: var(--spacing-l);

  @media (min-width: ${breakpoint.m}) {
    order: unset !important;
    margin-bottom: unset !important;
    position: relative;
    top: calc(var(--spacing-2-xl) * -1);
    margin-right: var(--spacing-l) !important;
  }
`;

const CarouselImage = styled.img`
  width: 100%;
  height: 400px;
  object-fit: cover;

  @media (max-width: ${breakpoint.m}) {
    width: 100%;
    height: auto;
  }
`;

const ThumbnailImage = styled.img`
  &:hover {
    opacity: 0.9;
  }

  object-fit: cover;
  width: 122px;
  height: 122px;

  @media (max-width: ${breakpoint.l}) {
    max-width: 100%;
    height: auto;
  }
`;

const ModalContent = styled.div`
  max-width: 578px;

  @media (max-width: ${breakpoint.s}) {
    margin: 0.5em;
  }
`;

const ThumbnailButton = styled.button`
  cursor: pointer;
  border: 0;
  background-color: transparent;
  padding: 0;
`;

const ModalImages = styled.div`
  margin-top: var(--spacing-layout-s);
  display: flex;
  max-width: 100%;
  overflow-x: auto;

  button {
    margin-right: 1em;
  }

  @media (max-width: ${breakpoint.s}) {
    margin-top: 0.25em;
  }
`;

const LargeImage = styled.img`
  max-width: 100%;
`;

const Images = ({ images, contextName }: Props): JSX.Element => {
  const { t } = useTranslation();
  const [showModal, setShowModal] = useState(false);
  const [currentImage, setCurrentImage] = useState<ReservationUnitImageType>();

  if (images?.length === 0) {
    return <div />;
  }

  return (
    <>
      <StyledCarousel>
        {images?.map((image, index) => (
          <CarouselImage
            key={image.smallUrl}
            alt={`${t("common:imgAltForSpace", { name: contextName })} #${
              index + 1
            }`}
            src={image.largeUrl || pixel}
            onClick={() => {
              setCurrentImage(image);
              setShowModal(true);
            }}
            aria-label={`${t("common:imgAltForSpace", {
              name: contextName,
            })} #${index + 1}`}
          />
        ))}
      </StyledCarousel>
      <Modal
        handleClose={() => {
          setShowModal(false);
        }}
        show={showModal}
        closeButtonKey="common:close"
      >
        <ModalContent>
          {currentImage ? (
            <LargeImage
              alt={t("common:imgAltForSpace")}
              src={currentImage.largeUrl}
            />
          ) : null}
          <ModalImages>
            {images?.map((image) => (
              <ThumbnailButton
                key={image.smallUrl}
                type="button"
                onClick={() => {
                  setCurrentImage(image);
                }}
              >
                <ThumbnailImage
                  alt={t("common:imgAltForSpace")}
                  src={image.smallUrl}
                />
              </ThumbnailButton>
            ))}
          </ModalImages>
        </ModalContent>
      </Modal>
    </>
  );
};

export default Images;
