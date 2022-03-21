import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { getParameters } from "../../modules/api";
import {
  Application,
  Application as ApplicationType,
  FormType,
  OptionType,
} from "../../modules/types";
import { mapOptions } from "../../modules/util";
import { CenterSpinner } from "../common/common";
import CompanyForm from "./CompanyForm";
import IndividualForm from "./IndividualForm";
import OrganisationForm from "./OrganisationForm";
import RadioButtons from "./RadioButtons";

type Props = {
  application: ApplicationType;
  onNext: (appToSave: Application) => void;
};

const typeForm = {
  individual: "individual",
  company: "company",
  association: "organisation",
  community: "organisation",
};

const Wrapper = styled.div`
  margin-bottom: var(--spacing-layout-l);
  padding-bottom: var(--spacing-l);
`;

const Page3 = ({ onNext, application }: Props): JSX.Element | null => {
  const [activeForm, setActiveForm] = useState(
    (application.applicantType
      ? typeForm[application.applicantType]
      : undefined) as FormType
  );

  const [homeCityOptions, setHomeCityOptions] = useState([] as OptionType[]);
  const [state, setState] = useState<"loading" | "done" | "error">("loading");

  useEffect(() => {
    async function fetchData() {
      try {
        const fetchedHomeCityOptions = await getParameters("city");
        setHomeCityOptions(mapOptions(fetchedHomeCityOptions));
        setState("done");
      } catch (e) {
        setState("error");
      }
    }
    fetchData();
  }, []);

  return state !== "loading" ? (
    <Wrapper>
      <RadioButtons activeForm={activeForm} setActiveForm={setActiveForm}>
        {null}
      </RadioButtons>
      {activeForm === "individual" ? (
        <IndividualForm application={application} onNext={onNext} />
      ) : null}
      {activeForm === "organisation" ? (
        <OrganisationForm
          homeCityOptions={homeCityOptions}
          application={application}
          onNext={onNext}
        />
      ) : null}
      {activeForm === "company" ? (
        <CompanyForm application={application} onNext={onNext} />
      ) : null}
    </Wrapper>
  ) : (
    <CenterSpinner />
  );
};

export default Page3;
