import { Application } from '../common/types';

export const minimalApplicationForInitialSave = (
  applicationRoundId: number
): Application => ({
  status: 'draft',
  applicationRoundId,
  organisation: null,
  applicationEvents: [],
  contactPerson: null,
});

const applicationInitializer = ({
  id,
  applicationRoundId,
}: Application): Application => {
  if (!id) {
    return {
      ...minimalApplicationForInitialSave(applicationRoundId),
    };
  }
  return {} as Application;
};

export default applicationInitializer;
