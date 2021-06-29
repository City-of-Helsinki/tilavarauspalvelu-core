import React from "react";
import { Application } from "../../common/types";

type Props = { application: Application };

const name = {
  association: "yhdistykselle",
  community: "yhdistykselle",
  company: "yritykselle",
};

const Applicant = ({ application }: Props): JSX.Element => {
  switch (application.applicantType) {
    case "individual": {
      return <> sinulle</>;
    }

    case "association":
    case "community":
    case "company": {
      return <> edustamallenne {name[application.applicantType]}</>;
    }

    default: {
      return <></>;
    }
  }
};
export default Applicant;
