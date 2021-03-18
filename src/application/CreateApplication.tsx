import { LoadingSpinner } from 'hds-react';
import React, { Dispatch, SetStateAction, useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { saveApplication } from '../common/api';
import { Application } from '../common/types';
import { deepCopy } from '../common/util';
import Container from '../component/Container';
import { minimalApplicationForInitialSave } from './applicationInitializer';

type Props = {
  applicationRoundId?: number;
};

const createNewApplication = async (
  applicationRoundId: number,
  history: ReturnType<typeof useHistory>,
  setInPorgress: Dispatch<SetStateAction<boolean>>
) => {
  setInPorgress(true);

  const templateApplication = {
    ...deepCopy(minimalApplicationForInitialSave(applicationRoundId)),
  } as Application;

  const savedApplication = await saveApplication(templateApplication);
  if (savedApplication.id) {
    history.replace(`/application/${savedApplication.id}`);
  } else {
    setInPorgress(false);
  }
};

const CreateApplication = ({
  applicationRoundId = 1,
}: Props): JSX.Element | null => {
  const [inProgress, setInPorgress] = useState(false);
  const history = useHistory();

  useEffect(() => {
    createNewApplication(applicationRoundId, history, setInPorgress);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <Container>{inProgress ? <LoadingSpinner /> : null}</Container>;
};

export default CreateApplication;
