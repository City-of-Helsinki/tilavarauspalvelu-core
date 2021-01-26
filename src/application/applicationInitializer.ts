import { Application } from '../common/types';

export const minimalApplicationForInitialSave = (
  applicationPeriodId: number
): Application => ({
  status: 'draft',
  applicationPeriodId,
  organisation: null,
  applicationEvents: [],
  contactPerson: null,
});

const applicationInitializer = ({
  id,
  applicationPeriodId,
}: Application): Application => {
  if (!id) {
    return {
      ...minimalApplicationForInitialSave(applicationPeriodId),
    };
  }
  return {} as Application;
};

export default applicationInitializer;
