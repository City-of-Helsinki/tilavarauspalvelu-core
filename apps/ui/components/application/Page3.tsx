import React, { useState } from "react";
import styled from "styled-components";
import {
  ApplicationType,
  ApplicationsApplicationApplicantTypeChoices,
} from "common/types/gql-types";
import { CompanyForm } from "./CompanyForm";
import { IndividualForm } from "./IndividualForm";
import { OrganisationForm } from "./OrganisationForm";
import RadioButtons from "./RadioButtons";
import { useOptions } from "@/hooks/useOptions";
import { ApplicationFormValues } from "./Form";

type Props = {
  application: ApplicationType;
  onNext: (appToSave: ApplicationFormValues) => void;
};

const Wrapper = styled.div`
  margin-bottom: var(--spacing-layout-l);
  padding-bottom: var(--spacing-l);
`;

const Page3 = ({
  onNext,
  application,
  type,
}: Props & {
  type: ApplicationsApplicationApplicantTypeChoices;
}): JSX.Element | null => {
  const { options } = useOptions();
  const { cityOptions } = options;

  switch (type) {
    case ApplicationsApplicationApplicantTypeChoices.Individual:
      return <IndividualForm application={application} onNext={onNext} />;
    case ApplicationsApplicationApplicantTypeChoices.Community:
    case ApplicationsApplicationApplicantTypeChoices.Association:
      return (
        <OrganisationForm
          homeCityOptions={cityOptions}
          application={application}
          onNext={onNext}
        />
      );
    case ApplicationsApplicationApplicantTypeChoices.Company:
      return <CompanyForm application={application} onNext={onNext} />;
    default:
      return null;
  }
};

const Page3Wrapped = (props: Props): JSX.Element => {
  const { application } = props;
  const [activeForm, setActiveForm] =
    useState<ApplicationsApplicationApplicantTypeChoices>(
      application.applicantType ??
        ApplicationsApplicationApplicantTypeChoices.Individual
    );
  return (
    <Wrapper>
      <RadioButtons activeForm={activeForm} setActiveForm={setActiveForm} />
      <Page3 {...props} type={activeForm} />
    </Wrapper>
  );
};

export default Page3Wrapped;
