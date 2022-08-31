import React, { useState } from "react";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import { Button as HDSButton, FileInput } from "hds-react";
import { ReservationUnitsReservationUnitImageImageTypeChoices } from "../../../common/gql-types";
import { Image } from "./types";

const Wrapper = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: var(--spacing-l);
`;

const Button = styled(HDSButton)`
  float: right;
`;

const ReservationUnitImage = styled.div`
  position: relative;
`;

const Actions = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 1em;

  margin-bottom: var(--spacing-s);
`;

const ImageTag = styled.img`
  max-height: 12.5em;
  width: 100%;
  object-fit: cover;
`;

const RUImage = ({ image }: { image: Image }): JSX.Element => {
  const [imageUrl, setImageUrl] = useState<string>(image.mediumUrl || "");

  if (image.bytes) {
    const reader = new FileReader();
    reader.addEventListener("load", () => setImageUrl(reader.result as string));
    reader.readAsDataURL(image.bytes);
  }

  return <ImageTag src={imageUrl} />;
};

let fakepk = -1;

const FileInputContainer = styled.div`
  div:nth-of-type(3) {
    width: 100%;
    button {
      width: 100%;
    }
  }
  ul#file-input-list {
    display: none;
  }
  div > div > div > div:nth-of-type(1) {
    display: none;
  }
  #file-input-success {
    display: none;
  }
  #file-input-info {
    display: none;
  }
  #file-input-helper {
    display: none;
  }
`;

const SmallButton = styled(Button)`
  border: 0;
  padding: 0;
  min-height: 0;
  span {
    padding: 0;
    margin: 0 !important;
    text-decoration: underline;
  }

  :hover {
    background-color: transparent;
  }
`;

type Props = {
  images: Image[];
  setImages: (images: Image[]) => void;
};

const ImageEditor = ({ images, setImages }: Props): JSX.Element => {
  const { t } = useTranslation();

  const addImage = (files: File[]) => {
    const imageType =
      images.length === 0
        ? ReservationUnitsReservationUnitImageImageTypeChoices.Main
        : ReservationUnitsReservationUnitImageImageTypeChoices.Other;

    setImages(
      [{ pk: (fakepk -= 1), imageType, bytes: files[0] } as Image].concat(
        images
      )
    );
  };

  const deleteImage = (pk: number) => {
    if (pk > 0) {
      setImages(
        images.map((image) => ({
          ...image,
          deleted: image.pk === pk ? true : image.deleted,
        }))
      );
    } else {
      setImages(images.filter((image) => image.pk !== pk));
    }
  };

  const setAsMainImage = async (pk: number) => {
    setImages(
      images.map((image) => ({
        ...image,
        imageType:
          pk === image.pk
            ? ReservationUnitsReservationUnitImageImageTypeChoices.Main
            : ReservationUnitsReservationUnitImageImageTypeChoices.Other,
      }))
    );
  };

  return (
    <Wrapper>
      <div>
        <FileInputContainer>
          <FileInput
            accept=".png,.jpg"
            buttonLabel={t("ImageEditor.buttonLabel")}
            dragAndDrop
            id="file-input"
            label={t("ImageEditor.label")}
            language="fi"
            dragAndDropInputLabel=" "
            maxSize={5242880}
            onChange={(files) => addImage(files)}
            tooltipText={t("ReservationUnitEditor.tooltip.images")}
          />
        </FileInputContainer>
      </div>
      {images
        .filter((image) => !image.deleted)
        .map((image) => (
          <ReservationUnitImage key={image.pk}>
            <Actions>
              {image.imageType ===
              ReservationUnitsReservationUnitImageImageTypeChoices.Main ? (
                <span>{t("ImageEditor.mainImage")}</span>
              ) : (
                <SmallButton
                  variant="secondary"
                  onClick={() => setAsMainImage(image.pk as number)}
                >
                  {t("ImageEditor.useAsMainImage")}
                </SmallButton>
              )}
              <SmallButton
                variant="secondary"
                onClick={() => deleteImage(image.pk as number)}
              >
                {t("ImageEditor.deleteImage")}
              </SmallButton>
            </Actions>
            <RUImage image={image} />
          </ReservationUnitImage>
        ))}
    </Wrapper>
  );
};

export default ImageEditor;
