import React, { useEffect, useState } from 'react';
import { ApplicationPeriod } from '../common/types';
import { getapplicationPeriods } from '../common/api';

const Head = (): JSX.Element => {
  const [applicationPeriods, setApplicationPeriods] = useState<
    ApplicationPeriod[]
  >([] as ApplicationPeriod[]);

  useEffect(() => {
    async function fetchData() {
      const periods = await getapplicationPeriods();
      setApplicationPeriods(periods);
    }

    fetchData();
  }, []);

  return (<ul>{applicationPeriods.map((p) => (<li>{p.applicationPeriodBegin}</li>))}</ul>);
};

export default Head;
