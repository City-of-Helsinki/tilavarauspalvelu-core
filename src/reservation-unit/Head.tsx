import {
  Button,
  IconGlyphEuro,
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
import { localizedValue } from '../common/util';
import useReservationUnitList from '../common/hook/useReservationUnitList';
import StartApplicationBar from '../component/StartApplicationBar';

interface Props {
  reservationUnit: ReservationUnitType;
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
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-s);
  font-weight: 500;

  div > h1 {
    margin-top: 0;
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

const SpaceName = styled.div`
  font-size: var(--fontsize-heading-m);
  font-family: var(--font-bold);
`;

const ButtonContainer = styled.div`
  margin-top: var(--spacing-layout-m);

  & > button {
    margin: 0;
  }
`;

const ImageContainer = styled.div`
  position: relative;

  img {
    position: absolute;
    z-index: 3;
  }
`;

const StyledKoros = styled(Koros)`
  margin-top: var(--spacing-l);
  fill: var(--tilavaraus-gray);
`;

const Head = ({ reservationUnit }: Props): JSX.Element => {
  const {
    selectReservationUnit,
    containsReservationUnit,
    removeReservationUnit,
    reservationUnits,
  } = useReservationUnitList();

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
            <SpaceName>
              {localizedValue(reservationUnit.spaces?.[0]?.name, i18n.language)}
            </SpaceName>
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
              <div>
                <IconWithText
                  icon={
                    <IconGlyphEuro
                      aria-label={t('reservationUnit.billableHours')}
                    />
                  }
                  texts={[
                    ['Ma-Pe', '10:00 - 20:00'],
                    ['La', '12:00 - 20:00'],
                    ['Su', '12:00 - 20:00'],
                  ]}
                />
              </div>
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
          <ImageContainer>
            <img
              alt={t('common.imgAltForSpace', {
                name: localizedValue(reservationUnit.name, i18n.language),
              })}
              width="588"
              height="406"
              src={
                reservationUnit.images[0]?.imageUrl ||
                'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs='
              }
            />
          </ImageContainer>
        </RightContainer>
      </Container>
      <StartApplicationBar count={reservationUnits.length} />
      <StyledKoros className="koros" type="wave" />
    </TopContainer>
  );
};

export default Head;
