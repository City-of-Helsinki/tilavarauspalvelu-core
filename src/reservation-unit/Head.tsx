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
import styled from 'styled-components';
import { ReservationUnit as ReservationUnitType } from '../common/types';
import IconWithText from './IconWithText';

import {
  SelectionsListContext,
  SelectionsListContextType,
} from '../context/SelectionsListContext';

interface Props {
  reservationUnit: ReservationUnitType;
}

const Container = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-s);
  font-weight: 500;
`;

const Props = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-s);
`;

const StyledIcon = styled(IconWithText)`
  margin-top: var(--spacing-s);
`;

const Head = ({ reservationUnit }: Props): JSX.Element => {
  const { addReservationUnit, containsReservationUnit } = React.useContext(
    SelectionsListContext
  ) as SelectionsListContextType;

  const { t } = useTranslation();

  return (
    <Container>
      <div>
        <h1 className="heading-l">{reservationUnit.name}</h1>
        <h2 className="heading-m">{reservationUnit.spaces?.[0]?.name}</h2>
        <Props>
          <div>
            <StyledIcon icon={<IconInfoCircle />} text="Nuorisotalo" />
            <StyledIcon icon={<IconGroup />} text="10 henkilöä" />
            <StyledIcon icon={<IconClock />} text="Max. 2 tuntia" />
          </div>
          <div>
            <StyledIcon icon={<IconCalendar />} text="7€ -10€/tunti" />
            <StyledIcon
              icon={<IconGlyphEuro />}
              texts={[
                ['Ma-Pe', '10:00 - 20:00'],
                ['La', '12:00 - 20:00'],
                ['Su', '12:00 - 20:00'],
              ]}
            />
          </div>
        </Props>
        <div style={{ marginTop: 'var(--spacing-layout-xs)' }}>
          <Button
            iconLeft={<IconHeart />}
            className="margin-top-s"
            variant="secondary">
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
    </Container>
  );
};

export default Head;
