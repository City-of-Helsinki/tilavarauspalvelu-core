import React, { useEffect, useState } from 'react';
import { ApplicationPeriod } from '../common/types';
import { getApplicationPeriods } from '../common/api';
import ApplicationPeriodCard from './ApplicationPeriodCard';

const ApplicationPeriodList = (): JSX.Element => {
  const [applicationPeriods, setApplicationPeriods] = useState<
    ApplicationPeriod[]
  >([]);

  useEffect(() => {
    async function fetchData() {
      const periods = await getApplicationPeriods();
      setApplicationPeriods(periods);
    }
    fetchData();
  }, []);

  return (
    <>
      {applicationPeriods.map((p) => (
        <ApplicationPeriodCard key={p.id} applicationPeriod={p} />
      ))}
    </>
  );
};

export default ApplicationPeriodList;
