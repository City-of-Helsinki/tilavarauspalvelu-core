import React, { useState } from "react";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import { Button, ButtonSize, ButtonVariant, FileInput } from "hds-react";
import { ImageType } from "@gql/gql-types";
import { AutoGrid, Flex } from "common/styles/util";
import { type ImageFormType } from "./form";
import { fontRegular } from "common";

const StyledImage = styled.img`
  max-height: 12.5em;
  width: 100%;
  object-fit: cover;
`;

function RUImage({ image }: { image: ImageFormType }): JSX.Element {
  // medium url seems to work when deployed but locally it's not available
  const [imageUrl, setImageUrl] = useState<string>(
    image.mediumUrl || image.imageUrl || ""
  );

  if (image.bytes) {
    const reader = new FileReader();
    reader.addEventListener("load", () => setImageUrl(reader.result as string));
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

const SmallButton = styled(Button).attrs({
  variant: ButtonVariant.Secondary,
  size: ButtonSize.Small,
})`
  ${fontRegular}
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

function ReservationUnitImage({
  makeIntoMainImage,
  deleteImage,
  image,
}: {
  makeIntoMainImage: (pk: number) => void;
  deleteImage: (pk: number) => void;
  image: ImageFormType;
}) {
  const isMain = image.imageType === ImageType.Main;
  const { t } = useTranslation();
  return (
    <Flex $gap="s">
      <Flex $direction="row" $gap="m" $justifyContent="space-between">
        {isMain ? (
          <span>{t("ImageEditor.mainImage")}</span>
        ) : (
          <SmallButton
            disabled={isMain || image.pk == null}
            onClick={() => makeIntoMainImage(image.pk ?? 0)}
          >
            {t("ImageEditor.useAsMainImage")}
          </SmallButton>
        )}
        <SmallButton
          disabled={image.pk == null}
          onClick={() => deleteImage(image.pk ?? 0)}
        >
          {t("ImageEditor.deleteImage")}
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

export function ImageEditor({
  images,
  setImages,
  style,
  className,
}: Props): JSX.Element {
  const { t } = useTranslation();

  const addImage = (files: File[]) => {
    const imageType = images.length === 0 ? ImageType.Main : ImageType.Other;

    const newImage: ImageFormType = {
      pk: fakePk,
      imageType,
      bytes: files[0],
    };
    fakePk -= 1;
    setImages([newImage].concat(images));
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
        imageType: pk === image.pk ? ImageType.Main : ImageType.Other,
      }))
    );
  };

  return (
    <AutoGrid style={style} className={className}>
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
            tooltipText={t("ImageEditor.tooltip")}
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
