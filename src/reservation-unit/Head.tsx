import {
  Button,
  IconGroup,
  IconInfoCircle,
  IconPlus,
  IconArrowLeft,
  Koros,
  IconCheck,
} from 'hds-react';
import { useHistory } from 'react-router-dom';
import React from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import { ReservationUnit as ReservationUnitType } from '../common/types';
import IconWithText from './IconWithText';
import Notification from './Notification';
import Container from '../component/Container';
import { getMainImage, localizedValue } from '../common/util';
import useReservationUnitList from '../common/hook/useReservationUnitList';
import { breakpoint } from '../common/style';

interface Props {
  reservationUnit: ReservationUnitType;
  reservationUnitList: ReturnType<typeof useReservationUnitList>;
}

const TopContainer = styled.div`
  background-color: white;
`;

const BackContainer = styled.div`
  padding-top: 1em;
  display: flex;
  align-items: center;
`;

const BackLabel = styled.span`
  font-size: var(--fontsize-body-s);
  margin-left: var(--spacing-2-xs);
`;

const RightContainer = styled.div`
  font-size: var(--fontsize-body-m);

  margin-top: var(--spacing-m);
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: var(--spacing-s);

  div > h1 {
    margin-top: 0;
  }

  @media (max-width: ${breakpoint.m}) {
    grid-template-columns: 1fr;
  }
`;

const Props = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-s);
`;

const ReservationUnitName = styled.h1`
  font-size: var(--fontsize-heading-l);
`;

const BuildingName = styled.div`
  font-size: var(--fontsize-heading-m);
  font-family: var(--font-bold);
`;

const ButtonContainer = styled.div`
  margin-top: var(--spacing-layout-m);

  & > button {
    margin: 0;
  }
`;

const Image = styled.img`
  width: 100%;
  height: 259px;
  object-fit: cover;
  @media (max-width: ${breakpoint.m}) {
    width: 100%;
    height: auto;
  }
`;

const StyledKoros = styled(Koros)`
  margin-top: var(--spacing-l);
  fill: var(--tilavaraus-gray);
`;

const Head = ({ reservationUnit, reservationUnitList }: Props): JSX.Element => {
  const {
    selectReservationUnit,
    containsReservationUnit,
    removeReservationUnit,
  } = reservationUnitList;

  const { t, i18n } = useTranslation();
  const history = useHistory();

  return (
    <TopContainer>
      <Notification applicationRound={null} />
      <Container>
        <BackContainer>
          <IconArrowLeft aria-hidden />
          <button
            type="button"
            onClick={() => {
              history.goBack();
            }}
            className="button-reset">
            <BackLabel>{t('ReservationUnit.backToSearch')}</BackLabel>
          </button>
        </BackContainer>
        <RightContainer>
          <div>
            <ReservationUnitName>
              {localizedValue(reservationUnit.name, i18n.language)}
            </ReservationUnitName>
            <BuildingName>
              {localizedValue(reservationUnit.building?.name, i18n.language)}
            </BuildingName>
            <Props>
              <div>
                <IconWithText
                  icon={
                    <IconInfoCircle aria-label={t('reservationUnit.type')} />
                  }
                  text={localizedValue(
                    reservationUnit.reservationUnitType?.name,
                    i18n.language
                  )}
                />
                <IconWithText
                  icon={
                    <IconGroup aria-label={t('reservationUnit.maxPersons')} />
                  }
                  text={t('ReservationUnit.maxPersons', {
                    maxPersons: reservationUnit.maxPersons,
                  })}
                />
              </div>
              <div />
            </Props>
            <ButtonContainer>
              {containsReservationUnit(reservationUnit) ? (
                <Button
                  onClick={() => removeReservationUnit(reservationUnit)}
                  iconLeft={<IconCheck />}
                  className="margin-left-s margin-top-s">
                  {t('common.reservationUnitSelected')}
                </Button>
              ) : (
                <Button
                  onClick={() => selectReservationUnit(reservationUnit)}
                  iconLeft={<IconPlus />}
                  className="margin-left-s margin-top-s"
                  variant="secondary">
                  {t('common.selectReservationUnit')}
                </Button>
              )}
            </ButtonContainer>
          </div>
          <Image
            alt={t('common.imgAltForSpace', {
              name: localizedValue(reservationUnit.name, i18n.language),
            })}
            src={
              getMainImage(reservationUnit)?.smallUrl ||
              'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs='
            }
          />
        </RightContainer>
      </Container>
      <StyledKoros className="koros" type="wave" />
    </TopContainer>
  );
};

export default Head;
