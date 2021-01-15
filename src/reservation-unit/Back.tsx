import { IconArrowLeft } from 'hds-react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useHistory } from 'react-router-dom';
import styled from 'styled-components';

const Container = styled.div`
  margin-top: 1em;
  display: flex;
  align-items: center;
  font-weight: 500;
`;

const ButtonText = styled.span`
  font-size: var(--fontsize-body-s);
  margin-left: var(--spacing-2-xs);
`;

const Back = (): JSX.Element => {
  const { t } = useTranslation();
  const history = useHistory();

  return (
    <Container>
      <IconArrowLeft />
      <button
        type="button"
        onClick={() => {
          history.goBack();
        }}
        className="button-reset">
        <ButtonText>{t('Takaisin hakutuloksiin')}</ButtonText>
      </button>
    </Container>
  );
};

export default Back;
