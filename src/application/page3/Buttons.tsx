import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button, IconArrowLeft, IconArrowRight } from 'hds-react';
import { useHistory } from 'react-router-dom';
import { ButtonContainer } from '../../component/common';

type Props = {
  onSubmit: () => void;
};

const Buttons = ({ onSubmit }: Props): JSX.Element | null => {
  const { t } = useTranslation();

  const history = useHistory();
  return (
    <ButtonContainer>
      <Button
        variant="secondary"
        iconLeft={<IconArrowLeft />}
        onClick={() => history.push('page2')}>
        {t('common.prev')}
      </Button>
      <Button id="next" iconRight={<IconArrowRight />} onClick={onSubmit}>
        {t('common.next')}
      </Button>
    </ButtonContainer>
  );
};

export default Buttons;
