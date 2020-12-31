import React, { useEffect, useState } from 'react';
import { parseISO } from 'date-fns';
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
      periods.sort(
        (ap1, ap2) =>
          parseISO(ap1.applicationPeriodBegin).getTime() -
          parseISO(ap2.applicationPeriodBegin).getTime()
      );

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
