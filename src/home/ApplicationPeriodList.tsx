import React, { useEffect, useState } from 'react';
import { parseISO } from 'date-fns';
import { ApplicationRound } from '../common/types';
import { getApplicationRounds } from '../common/api';
import { routeData } from '../common/const';
import ApplicationRoundCard from './ApplicationRoundCard';

type Props = {
  data?: ApplicationRound[];
};

const ApplicationPeriodList = ({ data }: Props): JSX.Element => {
  const [applicationRounds, setApplicationRounds] = useState<
    ApplicationRound[]
  >(data || []);

  useEffect(() => {
    async function fetchData() {
      const backendData = routeData()?.applicationRounds;
      let periods;
      if (backendData) {
        periods = backendData;
        routeData().applicationRounds = undefined;
      } else {
        periods = await getApplicationRounds();
      }

      periods.sort(
        (ar1: ApplicationRound, ar2: ApplicationRound) =>
          parseISO(ar1.applicationPeriodBegin).getTime() -
          parseISO(ar2.applicationPeriodBegin).getTime()
      );

      setApplicationRounds(periods);
    }
    fetchData();
  }, []);

  return (
    applicationRounds && (
      <>
        {applicationRounds.map((p) => (
          <ApplicationRoundCard applicationRound={p} key={`${p.id}${p.name}`} />
        ))}
      </>
    )
  );
};

export default ApplicationPeriodList;
