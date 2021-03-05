import React from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import { Image } from '../common/types';

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
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: var(--spacing-s);
`;

const ThumbnailImage = styled.img`
  margin-top: var(--spacing-layout-s);
`;

const Images = ({ images }: Props): JSX.Element => {
  const { t } = useTranslation();

  if (images.length === 0) {
    return <div />;
  }
  return (
    <Container>
      <Heading>{t('reservationUnit.images')}</Heading>
      <ImageGrid>
        {images.map((image) => (
          <ThumbnailImage
            alt={t('common.imgAltForSpace')}
            src={image.imageUrl}
          />
        ))}
      </ImageGrid>
    </Container>
  );
};

export default Images;
