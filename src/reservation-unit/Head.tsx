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

import { ReservationUnit as ReservationUnitType } from '../common/types';
import IconWithText from './IconWithText';

import styles from './Head.module.scss';
import {
  SelectionsListContext,
  SelectionsListContextType,
} from '../context/SelectionsListContext';
import Notification from './Notification';
import Container from '../component/Container';

interface Props {
  reservationUnit: ReservationUnitType;
}

const Head = ({ reservationUnit }: Props): JSX.Element => {
  const { addReservationUnit, containsReservationUnit } = React.useContext(
    SelectionsListContext
  ) as SelectionsListContextType;

  const { t } = useTranslation();
  const history = useHistory();

  return (
    <div className={styles.topContainer}>
      <Notification applicationPeriod={null} />
      <Container>
        <div className={styles.backContainer}>
          <IconArrowLeft />
          <button
            type="button"
            onClick={() => {
              history.goBack();
            }}
            className="button-reset">
            <span className={styles.backLabel}>
              {t('ReservationUnit.backToSearch')}
            </span>
          </button>
        </div>
        <div className={styles.container}>
          <div>
            <h1 className="heading-l">{reservationUnit.name}</h1>
            <h2 className="heading-m">{reservationUnit.spaces?.[0]?.name}</h2>
            <div className={styles.props}>
              <div>
                <IconWithText
                  icon={<IconInfoCircle />}
                  text={reservationUnit.reservationUnitType?.name}
                />
                <IconWithText
                  icon={<IconGroup />}
                  text={t('ReservationUnit.maxPersons', {
                    maxPersons: reservationUnit.maxPersons,
                  })}
                />
                <IconWithText icon={<IconClock />} text="Max. 2 tuntia" />
              </div>
              <div>
                <IconWithText icon={<IconCalendar />} text="7€ -10€/tunti" />
                <IconWithText
                  icon={<IconGlyphEuro />}
                  texts={[
                    ['Ma-Pe', '10:00 - 20:00'],
                    ['La', '12:00 - 20:00'],
                    ['Su', '12:00 - 20:00'],
                  ]}
                />
              </div>
            </div>
            <div className={styles.buttonContainer}>
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
            </div>
          </div>
          <div className={styles.imageContainer}>
            <img
              width="588"
              height="406"
              src={
                reservationUnit.images[0]?.imageUrl ||
                'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs='
              }
            />
          </div>
        </div>
      </Container>
      <Koros className={`${styles.koros} koros`} type="wave" />
    </div>
  );
};

export default Head;
