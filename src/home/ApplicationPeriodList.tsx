import React, { useEffect, useState } from 'react';
import { parseISO } from 'date-fns';
import { ApplicationPeriod } from '../common/types';
import { getApplicationPeriods } from '../common/api';
import ApplicationPeriodCard from './ApplicationPeriodCard';

interface IProps {
  data?: ApplicationPeriod[];
}

const ApplicationPeriodList = ({ data }: IProps): JSX.Element => {
  const [applicationPeriods, setApplicationPeriods] = useState<
    ApplicationPeriod[]
  >(data || []);

  useEffect(() => {
    async function fetchData() {
      // eslint-disable-next-line
      const backendData = window.__ROUTE_DATA__?.applicationPeriods;
      let periods;
      if (backendData) {
        periods = backendData;
        // eslint-disable-next-line
        window.__ROUTE_DATA__.applicationPeriods = undefined;
      } else {
        periods = await getApplicationPeriods();
      }

      periods.sort(
        (ap1: ApplicationPeriod, ap2: ApplicationPeriod) =>
          parseISO(ap1.applicationPeriodBegin).getTime() -
          parseISO(ap2.applicationPeriodBegin).getTime()
      );

      setApplicationPeriods(periods);
    }
    fetchData();
  }, []);

  return (
    applicationPeriods && (
      <>
        {applicationPeriods.map((p) => (
          <ApplicationPeriodCard
            applicationPeriod={p}
            key={`${p.id}${p.name}`}
          />
        ))}
      </>
    )
  );
};

export default ApplicationPeriodList;
