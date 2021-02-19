import { Application } from '../common/types';

export const minimalApplicationForInitialSave = (
  applicationRoundId: number
): Application => ({
  status: 'draft',
  applicantType: null,
  applicationRoundId,
  organisation: null,
  applicationEvents: [],
  contactPerson: null,
  billingAddress: null,
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
