import React from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import { Location, ReservationUnit } from '../common/types';
import { localizedValue } from '../common/util';
import ExternalLink from './ExternalLink';

type Props = {
  reservationUnit: ReservationUnit;
};

const Name = styled.div`
  font-size: var(--fontsize-heading-m);
  font-family: var(--font-bold);
`;

const AddressLine = styled.div`
  margin-top: var(--spacing-xs);
`;

const hslUrl = (locale: string, location: Location): string | null => {
  if (!location) {
    return null;
  }

  return `https://www.reittiopas.fi/${locale}/?to=${encodeURI(
    `${location.addressStreet},${location.addressCity}`
  )}`;
};

const googleUrl = (location: Location): string | null => {
  if (!location) {
    return null;
  }
  return `https://www.google.com/maps/dir/?api=1&destination=${location.addressStreet},${location.addressCity}`;
};

const mapUrl = (location: Location): string | null => {
  if (!location) {
    return null;
  }

  return `https://maps.google.com/?q=${location.addressStreet},${location.addressCity}`;
};

const Address = ({ reservationUnit }: Props): JSX.Element => {
  const { t, i18n } = useTranslation();

  return (
    <div>
      <Name>{localizedValue(reservationUnit.name, i18n.language)}</Name>
      {reservationUnit.location?.addressStreet ? (
        <AddressLine>{reservationUnit.location?.addressStreet}</AddressLine>
      ) : null}
      {reservationUnit.location?.addressZip &&
      reservationUnit.location?.addressCity ? (
        <AddressLine>
          {`${reservationUnit.location?.addressZip} ${reservationUnit.location?.addressCity}`}
        </AddressLine>
      ) : null}
      <ExternalLink
        href={mapUrl(reservationUnit.location)}
        name={t('reservationUnit.linkMap')}
      />
      <ExternalLink
        href={googleUrl(reservationUnit.location)}
        name={t('reservationUnit.linkGoogle')}
      />{' '}
      <ExternalLink
        href={hslUrl(i18n.language, reservationUnit.location)}
        name={t('reservationUnit.linkHSL')}
      />
    </div>
  );
};

export default Address;
