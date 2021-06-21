import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import dynamic from "next/dynamic";
import { breakpoint } from "../../modules/style";
import { Image } from "../../modules/types";

const Modal = dynamic(() => import("../common/Modal"));
type Props = {
  images: Image[];
};

const Heading = styled.div`
  font-size: var(--fontsize-heading-m);
  font-family: var(--font-bold);
`;

const Container = styled.div`
  margin-top: var(--spacing-layout-m);
`;

const ImageGrid = styled.div`
  margin-top: var(--spacing-layout-s);
  display: grid;
  gap: var(--spacing-xs);
  grid-template-columns: 1fr 1fr 1fr;
  @media (max-width: ${breakpoint.l}) {
    display: flex;
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
  max-width: 100vw;

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
  max-width: 100%;
  width: 100%;
  max-height: calc(100vh - 16em);
  object-fit: cover;
`;

const Images = ({ images }: Props): JSX.Element => {
  const { t } = useTranslation();
  const [showModal, setShowModal] = useState(false);
  const [currentImage, setCurrentImage] = useState<Image>();

  if (images.length === 0) {
    return <div />;
  }
  return (
    <Container>
      <Heading>{t("reservationUnit.images")}</Heading>
      <ImageGrid>
        {images.map((image) => (
          <div>
            <StyledButton
              type="button"
              onClick={() => {
                setCurrentImage(image);
                setShowModal(true);
              }}
            >
              <ThumbnailImage
                key={image.smallUrl}
                alt={t("common:imgAltForSpace")}
                src={image.smallUrl}
              />
            </StyledButton>
          </div>
        ))}
        <Modal
          handleClose={() => {
            setShowModal(false);
          }}
          show={showModal}
          closeButtonKey=":close"
        >
          <ModalContent>
            {currentImage ? (
              <LargeImage
                alt={t("common:imgAltForSpace")}
                src={currentImage.imageUrl}
              />
            ) : null}
            <ModalImages>
              {images.map((image) => (
                <StyledButton
                  type="button"
                  onClick={() => {
                    setCurrentImage(image);
                  }}
                >
                  <ThumbnailImage
                    key={image.smallUrl}
                    alt={t("common:imgAltForSpace")}
                    src={image.smallUrl}
                  />
                </StyledButton>
              ))}
            </ModalImages>
          </ModalContent>
        </Modal>
      </ImageGrid>
    </Container>
  );
};

export default Images;
