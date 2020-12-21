import {
  Button,
  IconCalendar,
  IconClock,
  IconGlyphEuro,
  IconGroup,
  IconHeart,
  IconInfoCircle,
  IconPlus,
} from 'hds-react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { ReservationUnit as ReservationUnitType } from '../common/types';
import IconWithText from './IconWithText';

import styles from './Head.module.scss';
import {
  SelectionsListContext,
  SelectionsListContextType,
} from '../context/SelectionsListContext';

interface Props {
  reservationUnit: ReservationUnitType;
}

const Head = ({ reservationUnit }: Props): JSX.Element => {
  const { addReservationUnit, containsReservationUnit } = React.useContext(
    SelectionsListContext
  ) as SelectionsListContextType;

  const { t } = useTranslation();

  return (
    <div className={styles.container}>
      <div>
        <h1 className="heading-l">{reservationUnit.name}</h1>
        <h2 className="heading-m">{reservationUnit.spaces?.[0]?.name}</h2>
        <div className={styles.props}>
          <div>
            <IconWithText icon={<IconInfoCircle />} text="Nuorisotalo" />
            <IconWithText icon={<IconGroup />} text="10 henkilöä" />
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
        <div style={{ marginTop: 'var(--spacing-layout-xs)' }}>
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
      <img
        width="588"
        height="406"
        src="https://api.hel.fi/respa/resource_image/671?dim=588x406"
      />
    </div>
  );
};

export default Head;
