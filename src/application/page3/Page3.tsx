import React, { useState } from 'react';
import styled from 'styled-components';
import { Application as ApplicationType, FormType } from '../../common/types';
import CompanyForm from './CompanyForm';
import IndividualForm from './IndividualForm';
import OrganisationForm from './OrganisationForm';
import RadioButtons from './RadioButtons';

type Props = {
  application: ApplicationType;
  onNext: () => void;
};

const typeForm = {
  individual: 'individual',
  company: 'company',
  association: 'organisation',
  community: 'organisation',
};

const Container = styled.div`
  margin-top: var(--spacing-layout-m);
`;

const Page3 = ({ onNext, application }: Props): JSX.Element | null => {
  const [activeForm, setActiveForm] = useState(
    (application.applicantType
      ? typeForm[application.applicantType]
      : undefined) as FormType
  );

  return (
    <Container>
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
    </Container>
  );
};

export default Page3;
