import React, { useState } from "react";
import { FileInput } from "hds-react";
import { useTranslation } from "next-i18next";
import styled from "styled-components";
import { AutoGrid, Flex, focusStyles, removeButtonStyles } from "ui/src/styled";
import { ReservationUnitImageType } from "@gql/gql-types";
import type { ImageFormType } from "./form";

const StyledImage = styled.img`
  max-height: 12.5em;
  width: 100%;
  object-fit: cover;
`;

function RUImage({ image }: { image: ImageFormType }): JSX.Element {
  // medium url seems to work when deployed but locally it's not available
  const [imageUrl, setImageUrl] = useState<string>(image.mediumUrl || image.imageUrl || "");

  if (image.bytes) {
    const reader = new FileReader();
    reader.addEventListener("load", () => {
      setImageUrl(reader.result?.toString() ?? "");
    });
    reader.readAsDataURL(image.bytes);
  }

  return <StyledImage src={imageUrl} />;
}

let fakePk = -1;

const FileInputContainer = styled.div`
  & button {
    --background-color-hover: var(--color-black-5);
    --color-hover: var(--color-black);
    --color: var(--color-black);
    --border-color: var(--color-black);
  }

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

const SmallButton = styled.button`
  ${removeButtonStyles}

  text-decoration: underline;
  ${focusStyles}
  &:hover {
    background-color: var(--color-black-10);
    cursor: pointer;
  }
`;

function ReservationUnitImage({
  makeIntoMainImage,
  deleteImage,
  image,
}: {
  makeIntoMainImage: (pk: number) => void;
  deleteImage: (pk: number) => void;
  image: ImageFormType;
}) {
  const isMain = image.imageType === ReservationUnitImageType.Main;
  const { t } = useTranslation();
  return (
    <Flex $gap="s">
      <Flex $direction="row" $gap="m" $justifyContent="space-between">
        {isMain ? (
          <span>{t("reservationUnitEditor:ImageEditor.mainImage")}</span>
        ) : (
          <SmallButton disabled={isMain || image.pk == null} onClick={() => makeIntoMainImage(image.pk ?? 0)}>
            {t("reservationUnitEditor:ImageEditor.useAsMainImage")}
          </SmallButton>
        )}
        <SmallButton disabled={image.pk == null} onClick={() => deleteImage(image.pk ?? 0)}>
          {t("common:remove")}
        </SmallButton>
      </Flex>
      <RUImage image={image} />
    </Flex>
  );
}

type Props = {
  images: ImageFormType[];
  setImages: (images: ImageFormType[]) => void;
  style?: React.CSSProperties;
  className?: string;
};

export function ImageEditor({ images, setImages, style, className }: Props): JSX.Element {
  const { t } = useTranslation();

  const addImage = (files: File[]) => {
    const imageType = images.length === 0 ? ReservationUnitImageType.Main : ReservationUnitImageType.Other;

    const newImage: ImageFormType = {
      pk: fakePk,
      imageType,
      bytes: files[0],
    };
    fakePk -= 1;
    setImages([newImage, ...images]);
  };

  const deleteImage = (pk: number) => {
    // NOTE this doesn't swap the main image, but customer UI defaults to the first other image if there is no main image
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

  const setAsMainImage = (pk: number) => {
    setImages(
      images.map((image) => ({
        ...image,
        imageType: pk === image.pk ? ReservationUnitImageType.Main : ReservationUnitImageType.Other,
      }))
    );
  };

  return (
    <AutoGrid style={style} className={className}>
      <div>
        <FileInputContainer>
          <FileInput
            accept=".png,.jpg"
            buttonLabel={t("reservationUnitEditor:ImageEditor.buttonLabel")}
            dragAndDrop
            id="file-input"
            label={t("reservationUnitEditor:ImageEditor.label")}
            language="fi"
            dragAndDropInputLabel=" "
            maxSize={5242880}
            onChange={(files) => addImage(files)}
            tooltipText={t("reservationUnitEditor:ImageEditor.tooltip")}
          />
        </FileInputContainer>
      </div>
      {images
        .filter((image) => !image.deleted)
        .map((image) => (
          <ReservationUnitImage
            key={image.pk}
            makeIntoMainImage={setAsMainImage}
            deleteImage={deleteImage}
            image={image}
          />
        ))}
    </AutoGrid>
  );
}
