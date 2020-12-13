import { IconArrowLeft } from 'hds-react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useHistory } from 'react-router-dom';

const Head = (): JSX.Element => {
  const { t } = useTranslation();
  const history = useHistory();

  return (
    <div
      style={{
        marginTop: '1em',
        display: 'flex',
        alignItems: 'center',
        fontWeight: 500,
      }}>
      <IconArrowLeft />
      <button
        type="button"
        onClick={() => {
          history.goBack();
        }}
        className="button-reset">
        <span
          style={{
            fontSize: 'var(--fontsize-body-s)',
            marginLeft: 'var(--spacing-2-xs)',
          }}>
          {t('Takaisin hakutuloksiin')}
        </span>
      </button>
    </div>
  );
};

export default Head;
