import React, { useState } from 'react';
import {
  Application,
  Application as ApplicationType,
  FormType,
} from '../../common/types';
import CompanyForm from './CompanyForm';
import IndividualForm from './IndividualForm';
import OrganisationForm from './OrganisationForm';
import RadioButtons from './RadioButtons';

type Props = {
  application: ApplicationType;
  onNext: (appToSave: Application) => void;
};

const typeForm = {
  individual: 'individual',
  company: 'company',
  association: 'organisation',
  community: 'organisation',
};

const Page3 = ({ onNext, application }: Props): JSX.Element | null => {
  const [activeForm, setActiveForm] = useState(
    (application.applicantType
      ? typeForm[application.applicantType]
      : undefined) as FormType
  );

  return (
    <>
      {activeForm === 'individual' ? (
        <IndividualForm
          activeForm={activeForm}
          setActiveForm={setActiveForm}
          application={application}
          onNext={onNext}
        />
      ) : null}
      {activeForm === 'organisation' ? (
        <OrganisationForm
          activeForm={activeForm}
          setActiveForm={setActiveForm}
          application={application}
          onNext={onNext}
        />
      ) : null}
      {activeForm === 'company' ? (
        <CompanyForm
          activeForm={activeForm}
          setActiveForm={setActiveForm}
          application={application}
          onNext={onNext}
        />
      ) : null}
      {activeForm === undefined ? (
        <RadioButtons activeForm={activeForm} setActiveForm={setActiveForm}>
          {null}
        </RadioButtons>
      ) : null}
    </>
  );
};

export default Page3;
