import React, { useState } from "react";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import { Button as HDSButton, FileInput } from "hds-react";
import { useMutation, useQuery } from "@apollo/client";
import {
  CREATE_IMAGE,
  RESERVATIONUNIT_IMAGES_QUERY,
} from "../../common/queries";
import {
  Mutation,
  Query,
  QueryReservationUnitByPkArgs,
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

  useQuery<Query, QueryReservationUnitByPkArgs>(RESERVATIONUNIT_IMAGES_QUERY, {
    variables: { pk: Number(reservationUnitPk) },
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

  const addImage = (files: File[]) => {
    const imageType =
      images.length === 0
        ? ReservationUnitsReservationUnitImageImageTypeChoices.Main
        : ReservationUnitsReservationUnitImageImageTypeChoices.Other;
    create({
      variables: {
        image: files[0],
        reservationUnitPk,
        imageType,
      },
    }).then((a) => {
      if (!a.errors) {
        const newImage =
          a.data?.createReservationUnitImage?.reservationUnitImage;
        if (newImage) {
          setImages([newImage].concat(images));
        }
        return;
      }
      setNotification({
        title: t("ImageEditor.errorTitle"),
        message: t("ImageEditor.errorSavingImage"),
        type: "error",
      });
    });
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
              <SmallButton variant="secondary">
                {t("ImageEditor.useAsMainImage")}
              </SmallButton>
            )}
            <SmallButton variant="secondary">
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
