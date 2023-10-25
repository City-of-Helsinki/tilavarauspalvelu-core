import React, { useState } from "react";
import styled from "styled-components";
import {
  ApplicationType,
  ApplicationsApplicationApplicantTypeChoices,
} from "common/types/gql-types";
import { useFormContext } from "react-hook-form";
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

const Form = styled.form`
  margin-bottom: var(--spacing-layout-l);
  padding-bottom: var(--spacing-l);
`;

const Page3 = ({
  application,
  type,
}: {
  application: ApplicationType;
  type: ApplicationsApplicationApplicantTypeChoices;
}): JSX.Element | null => {
  const { options } = useOptions();
  const { cityOptions } = options;

  switch (type) {
    case ApplicationsApplicationApplicantTypeChoices.Individual:
      return <IndividualForm application={application} />;
    case ApplicationsApplicationApplicantTypeChoices.Community:
    case ApplicationsApplicationApplicantTypeChoices.Association:
      return (
        <OrganisationForm
          homeCityOptions={cityOptions}
          application={application}
        />
      );
    case ApplicationsApplicationApplicantTypeChoices.Company:
      return <CompanyForm application={application} />;
    default:
      return null;
  }
};

const Page3Wrapped = (props: Props): JSX.Element => {
  const { application, onNext } = props;
  const [activeForm, setActiveForm] =
    useState<ApplicationsApplicationApplicantTypeChoices>(
      application.applicantType ??
        ApplicationsApplicationApplicantTypeChoices.Individual
    );
  const { handleSubmit } = useFormContext<ApplicationFormValues>();
  return (
    <Form noValidate onSubmit={handleSubmit(onNext)}>
      <RadioButtons activeForm={activeForm} setActiveForm={setActiveForm} />
      <Page3 {...props} type={activeForm} />
    </Form>
  );
};

export default Page3Wrapped;
