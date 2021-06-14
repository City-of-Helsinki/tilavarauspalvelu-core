import React from "react";
import { H1, P } from "./Typography";
import { PDFDocument, PDFPage } from "./PDFDocument";
import Applicant from "./Applicant";
import DecisionMaker from "./DecisionMaker";
import { Application } from "../../modules/types";
import ComplaintInfo from "./ComplaintInfo";

type Props = {
  application: Application;
  decisionMaker: string;
};

const NoReservationsDocument = ({
  application,
  decisionMaker,
}: Props): JSX.Element => (
  <PDFDocument application={application} hasReservations={false}>
    <PDFPage>
      <P />
      <P />
      <H1>
        Hyvä {application.contactPerson?.firstName}{" "}
        {application.contactPerson?.lastName},
      </H1>
      <P>
        hakemuksenne perusteella <Applicant application={application} /> ei
        valitettavasti ole voitu myöntää käyttövuoroja nuorisopalvelun tiloihin.
      </P>
      <ComplaintInfo />
      <DecisionMaker decisionMaker={decisionMaker} />
    </PDFPage>
  </PDFDocument>
);

export default NoReservationsDocument;
