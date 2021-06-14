import React, { useEffect, useState } from "react";
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
    <>
      {activeForm === "individual" ? (
        <IndividualForm
          activeForm={activeForm}
          setActiveForm={setActiveForm}
          application={application}
          onNext={onNext}
        />
      ) : null}
      {activeForm === "organisation" ? (
        <OrganisationForm
          homeCityOptions={homeCityOptions}
          activeForm={activeForm}
          setActiveForm={setActiveForm}
          application={application}
          onNext={onNext}
        />
      ) : null}
      {activeForm === "company" ? (
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
  ) : (
    <CenterSpinner />
  );
};

export default Page3;
