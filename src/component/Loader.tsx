import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CenterSpinner } from './common';
import { ApiData } from '../common/hook/useApiData';

type Params = {
  // eslint-disable-next-line
  datas: ApiData<any, any>[];
  children: React.ReactNode;
};

const Loader = ({ children, datas }: Params): JSX.Element => {
  const [triggerSpinner, setTriggerSpinner] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    const i = setTimeout(() => setTriggerSpinner(true), 800);
    return () => clearTimeout(i);
  }, []);

  const hasError = datas.filter((d) => d.status === 'error').length > 0;
  const isLoading =
    datas.filter((d) => d.status === 'loading' || d.status === 'init').length >
    0;

  if (hasError) {
    return <span>{t('common.error.dataError')}</span>;
  }

  if (isLoading && triggerSpinner) {
    return <CenterSpinner />;
  }

  if (isLoading) {
    return <></>;
  }

  return <>{children}</>;
};

export default Loader;
