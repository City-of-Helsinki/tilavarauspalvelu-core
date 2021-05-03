import { Button as HDSButton, IconArrowLeft } from 'hds-react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useHistory } from 'react-router-dom';
import styled from 'styled-components';

const Button = styled(HDSButton)`
  font-family: var(--font-bold);
  font-size: var(--fontsize-body-s);
  margin-left: 0;
  padding-left: 0;
  color: black;
  && div {
    margin-left: 0;
    padding-left: 0;
  }
`;

type Props = {
  label?: string;
};

const Back = ({ label = 'common.prev' }: Props): JSX.Element => {
  const { t } = useTranslation();
  const history = useHistory();

  return (
    <div>
      <Button
        aria-label={t(label)}
        variant="supplementary"
        type="button"
        iconLeft={<IconArrowLeft />}
        onClick={() => history.goBack()}>
        {t(label)}
      </Button>
    </div>
  );
};

export default Back;
