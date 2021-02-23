import {
  Button,
  IconCalendar,
  IconClock,
  IconGlyphEuro,
  IconGroup,
  IconHeart,
  IconInfoCircle,
  IconPlus,
  IconArrowLeft,
  Koros,
} from 'hds-react';
import { useHistory } from 'react-router-dom';
import React from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import { ReservationUnit as ReservationUnitType } from '../common/types';
import IconWithText from './IconWithText';
import {
  SelectionsListContext,
  SelectionsListContextType,
} from '../context/SelectionsListContext';
import Notification from './Notification';
import Container from '../component/Container';
import { localizedValue } from '../common/util';

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

const ButtonContainer = styled.div`
  margin-top: var(--spacing-layout-xs);
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
  const { addReservationUnit, containsReservationUnit } = React.useContext(
    SelectionsListContext
  ) as SelectionsListContextType;

  const { t, i18n } = useTranslation();
  const history = useHistory();

  return (
    <TopContainer>
      <Notification applicationPeriod={null} />
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
            <h1 className="heading-l">
              {localizedValue(reservationUnit.name, i18n.language)}
            </h1>
            <h2 className="heading-m">
              {localizedValue(reservationUnit.spaces?.[0]?.name, i18n.language)}
            </h2>
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
                <IconWithText
                  icon={
                    <IconClock aria-label={t('reservationUnit.maxDuration')} />
                  }
                  text="Max. 2 tuntia"
                />
              </div>
              <div>
                <IconWithText
                  icon={
                    <IconCalendar aria-label={t('reservationUnit.price')} />
                  }
                  text="7€ -10€/tunti"
                />
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
              <Button
                iconLeft={<IconHeart />}
                className="margin-top-s"
                variant="secondary"
                disabled>
                {t('common.favourite')}
              </Button>
              <Button
                disabled={containsReservationUnit(reservationUnit)}
                onClick={() => addReservationUnit(reservationUnit)}
                iconLeft={<IconPlus />}
                className="margin-left-s margin-top-s"
                variant="secondary">
                {t('common.selectReservationUnit')}
              </Button>
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
      <StyledKoros className="koros" type="wave" />
    </TopContainer>
  );
};

export default Head;
