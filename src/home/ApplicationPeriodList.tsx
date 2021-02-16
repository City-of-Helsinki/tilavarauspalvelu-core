import React, { useEffect, useState } from 'react';
import { parseISO } from 'date-fns';
import { ApplicationPeriod } from '../common/types';
import { getApplicationPeriods } from '../common/api';
import ApplicationPeriodCard from './ApplicationPeriodCard';
import { routeData } from '../common/const';

interface IProps {
  data?: ApplicationPeriod[];
}

const ApplicationPeriodList = ({ data }: IProps): JSX.Element => {
  const [applicationPeriods, setApplicationPeriods] = useState<
    ApplicationPeriod[]
  >(data || []);

  useEffect(() => {
    async function fetchData() {
      const backendData = routeData()?.applicationPeriods;
      let periods;
      if (backendData) {
        periods = backendData;
        routeData().applicationPeriods = undefined;
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
