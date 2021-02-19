import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button, IconArrowLeft, IconArrowRight } from 'hds-react';
import { ButtonContainer } from '../../component/common';

type Props = {
  onSubmit: () => void;
};

const Buttons = ({ onSubmit }: Props): JSX.Element | null => {
  const { t } = useTranslation();
  return (
    <ButtonContainer>
      <Button variant="secondary" iconLeft={<IconArrowLeft />} disabled>
        {t('common.prev')}
      </Button>
      <Button id="next" iconRight={<IconArrowRight />} onClick={onSubmit}>
        {t('common.next')}
      </Button>
    </ButtonContainer>
  );
};

export default Buttons;
