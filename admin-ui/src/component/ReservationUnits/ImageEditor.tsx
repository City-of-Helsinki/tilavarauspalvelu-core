import React, { useState } from "react";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import { Button as HDSButton, FileInput } from "hds-react";
import { useMutation, useQuery } from "@apollo/client";
import {
  CREATE_IMAGE,
  DELETE_IMAGE,
  RESERVATIONUNIT_IMAGES_QUERY,
  UPDATE_IMAGE_TYPE,
} from "../../common/queries";
import {
  Mutation,
  Query,
  ReservationUnitImageCreateMutationInput,
  ReservationUnitImageType,
  ReservationUnitsReservationUnitImageImageTypeChoices,
} from "../../common/gql-types";
import { useNotification } from "../../context/NotificationContext";

const Wrapper = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: var(--spacing-l);
`;

const Button = styled(HDSButton)`
  float: right;
`;

const ReservationUnitImage = styled.div``;

const Actions = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 1em;

  margin-bottom: var(--spacing-s);
`;

const Image = styled.img`
  max-height: 12.5em;
  width: 100%;
  object-fit: cover;
`;
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
  div:nth-of-type(2) {
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

const ImageEditor = ({
  reservationUnitPk,
}: {
  reservationUnitPk: number;
}): JSX.Element => {
  const { setNotification } = useNotification();
  const { t } = useTranslation();
  const [images, setImages] = useState<ReservationUnitImageType[]>([]);

  const sortImages = (imagesToSort: ReservationUnitImageType[]) => {
    imagesToSort.sort((a, b) => {
      if (
        a.imageType ===
        ReservationUnitsReservationUnitImageImageTypeChoices.Main
      ) {
        return -1;
      }
      if (
        b.imageType ===
        ReservationUnitsReservationUnitImageImageTypeChoices.Main
      ) {
        return 1;
      }

      return 0;
    });

    return imagesToSort;
  };

  useQuery<Query>(RESERVATIONUNIT_IMAGES_QUERY, {
    variables: { pk: Number(reservationUnitPk) },
    skip: !reservationUnitPk,
    onCompleted: ({ reservationUnitByPk }) => {
      if (reservationUnitByPk?.images) {
        setImages(reservationUnitByPk.images as ReservationUnitImageType[]);
      } else {
        setNotification({
          title: t("errors.errorFetchingData"),
          message: t("ImageEditor.errorLoadingImages"),
          type: "error",
        });
      }
    },
    onError: () => {
      setNotification({
        title: t("errors.errorFetchingData"),
        message: t("ImageEditor.errorLoadingImages"),
        type: "error",
      });
    },
  });

  const [create] = useMutation<
    Mutation,
    ReservationUnitImageCreateMutationInput
  >(CREATE_IMAGE);

  const [delImage] = useMutation<Mutation>(DELETE_IMAGE);
  const [updateImagetype] = useMutation<Mutation>(UPDATE_IMAGE_TYPE);

  const addImage = async (files: File[]) => {
    const imageType =
      images.length === 0
        ? ReservationUnitsReservationUnitImageImageTypeChoices.Main
        : ReservationUnitsReservationUnitImageImageTypeChoices.Other;

    try {
      const result = await create({
        variables: {
          image: files[0],
          reservationUnitPk,
          imageType,
        },
      });
      if (!result.data?.createReservationUnitImage?.errors) {
        const newImage =
          result.data?.createReservationUnitImage?.reservationUnitImage;
        if (newImage) {
          setImages(sortImages([newImage].concat(images)));
        }
      }
      return;
    } catch (e) {
      // dee below
    }

    setNotification({
      title: t("ImageEditor.errorTitle"),
      message: t("ImageEditor.errorSavingImage"),
      type: "error",
    });
  };

  const deleteImage = async (pk: number) => {
    try {
      const result = await delImage({
        variables: {
          pk,
        },
      });
      if (!result.data?.deleteReservationUnitImage?.errors) {
        setNotification({
          title: t("ImageEditor.imageDeletedTitle"),
          message: t("ImageEditor.imageDeleted"),
          type: "success",
        });
        setImages(sortImages(images.filter((image) => image.pk !== pk)));
        return;
      }
    } catch (e) {
      // see below
    }
    setNotification({
      title: t("ImageEditor.errorTitle"),
      message: t("ImageEditor.errorDeletingImage"),
      type: "error",
    });
  };

  const setAsMainImage = async (pk: number) => {
    const promises = images.map((image) => {
      return updateImagetype({
        variables: {
          pk: image.pk,
          imageType:
            pk === image.pk
              ? ReservationUnitsReservationUnitImageImageTypeChoices.Main
              : ReservationUnitsReservationUnitImageImageTypeChoices.Other,
        },
      });
    });

    const results = await Promise.all(promises);
    const hasError = results.find((result) =>
      Boolean(result.data?.updateReservationUnitImage?.errors)
    );

    if (hasError) {
      setNotification({
        title: t("ImageEditor.errorTitle"),
        message: t("ImageEditor.errorChangingImageType"),
        type: "error",
      });
      return;
    }

    // all ok
    setImages(
      sortImages(
        images.map((image) => ({
          ...image,
          imageType:
            image.pk === pk
              ? ReservationUnitsReservationUnitImageImageTypeChoices.Main
              : ReservationUnitsReservationUnitImageImageTypeChoices.Other,
        }))
      )
    );
  };

  return (
    <Wrapper>
      {reservationUnitPk > 0 ? (
        <div>
          <FileInputContainer>
            <FileInput
              accept=".png,.jpg"
              buttonLabel={t("ImageEditor.buttonLabel")}
              dragAndDrop
              id="file-input"
              label={t("ImageEditor.label")}
              language="fi"
              dragAndDropInputLabel="tai"
              maxSize={15728640}
              infoText="info"
              onChange={(files) => addImage(files)}
            />
          </FileInputContainer>
        </div>
      ) : (
        <>{t("ImageEditor.reservationUnitIsNotSaved")}</>
      )}
      {images.map((i) => (
        <ReservationUnitImage>
          <Actions>
            {i.imageType ===
            ReservationUnitsReservationUnitImageImageTypeChoices.Main ? (
              <span>{t("ImageEditor.mainImage")}</span>
            ) : (
              <SmallButton
                variant="secondary"
                onClick={() => setAsMainImage(i.pk as number)}
              >
                {t("ImageEditor.useAsMainImage")}
              </SmallButton>
            )}
            <SmallButton
              variant="secondary"
              onClick={() => deleteImage(i.pk as number)}
            >
              {t("ImageEditor.deleteImage")}
            </SmallButton>
          </Actions>
          <Image src={i.mediumUrl as string} />
        </ReservationUnitImage>
      ))}
    </Wrapper>
  );
};

export default ImageEditor;
