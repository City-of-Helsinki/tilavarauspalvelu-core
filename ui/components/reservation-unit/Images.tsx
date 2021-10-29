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
  object-fit: cover;
  width: 122px;
  height: 122px;

  @media (max-width: ${breakpoint.l}) {
    max-width: 100%;
    height: auto;
  }
`;

const ModalContent = styled.div`
  max-width: 94vw;

  @media (max-width: ${breakpoint.s}) {
    margin: 0.5em;
  }
`;

const StyledButton = styled.button`
  cursor: pointer;
  border: 0;
  background-color: transparent;
  padding: 0;
`;

const ModalImages = styled.div`
  margin-top: var(--spacing-layout-s);
  display: flex;

  button {
    margin-right: 1em;
  }

  @media (max-width: ${breakpoint.s}) {
    margin-top: 0.25em;
  }
`;
const LargeImage = styled.img`
  max-width: 90vw;
  max-height: calc(100vh - 16em);
`;

const Images = ({ images }: Props): JSX.Element => {
  const { t } = useTranslation();
  const [showModal, setShowModal] = useState(false);
  const [currentImage, setCurrentImage] = useState<ReservationUnitImageType>();

  if (images?.length === 0) {
    return <div />;
  }

  return (
    <>
      <StyledCarousel>
        {images?.map((image) => (
          <CarouselImage
            key={image.smallUrl}
            alt={t("common:imgAltForSpace")}
            src={image.mediumUrl || pixel}
            onClick={() => {
              setCurrentImage(image);
              setShowModal(true);
            }}
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
              src={currentImage.imageUrl}
            />
          ) : null}
          <ModalImages>
            {images?.map((image) => (
              <StyledButton
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
              </StyledButton>
            ))}
          </ModalImages>
        </ModalContent>
      </Modal>
    </>
  );
};

export default Images;
