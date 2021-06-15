import React from "react";
import { Text, View } from "@react-pdf/renderer";
import { B, H1, P, SIZE_MEDIUM } from "./Typography";
import {
  Application,
  ApplicationEvent,
  ReservationModified,
  ReservationUnit,
} from "../../common/types";
import { PDFDocument, PDFPage } from "./PDFDocument";

import ReservationsTable from "./ReservationsTable";
import Applicant from "./Applicant";
import ComplaintInfo from "./ComplaintInfo";
import DecisionMaker from "./DecisionMaker";

type Props = {
  application: Application;
  reservations: ReservationModified[];
  decisionMaker: string;
};

const ReservationsDocument = ({
  application,
  reservations,
  decisionMaker,
}: Props): JSX.Element => (
  <PDFDocument application={application} hasReservations>
    <PDFPage>
      <P />
      <P />
      <H1>
        Hyvä {application.contactPerson?.firstName}{" "}
        {application.contactPerson?.lastName},
      </H1>
      <P>
        hakemuksenne perusteella <Applicant application={application} /> on
        myönnetty seuraavat käyttövuorot nuorisopalvelun tiloihin.
      </P>
      <ComplaintInfo />
      <DecisionMaker decisionMaker={decisionMaker} />
    </PDFPage>
    {application.applicationEvents.map(
      (applicationEvent: ApplicationEvent): JSX.Element[] => {
        const eventReservations = reservations.filter(
          (res: ReservationModified) => {
            return res.applicationEventId === applicationEvent.id;
          }
        );

        const eventReservationUnits = eventReservations
          .flatMap((value) => value.reservationUnit)
          .reduce((prev, current) => {
            if (!prev.find((v) => v.id === current.id)) {
              prev.push(current);
            }
            return prev;
          }, [] as ReservationUnit[]);

        return eventReservationUnits.map((resUnit) => {
          const reservationUnitReservations = eventReservations.filter(
            (er) => er.reservationUnit.id === resUnit.id
          );

          const hasCancelations = Boolean(
            reservationUnitReservations.find((res) => res.state !== "confirmed")
          );

          return (
            <PDFPage key={resUnit.id}>
              <P />
              <Text>Vakiovuoron nimi</Text>
              <H1>{applicationEvent.name}</H1>
              <P />
              <Text>
                Vuorolle myönnetyt käyttövuorot nuorisopalvelun tilaan
              </Text>
              <View style={{ fontSize: SIZE_MEDIUM }}>
                <B>{resUnit.name.fi}</B>
                <Text>{resUnit.building.name}</Text>
              </View>
              <P />
              <ReservationsTable
                applicationEvent={applicationEvent}
                reservationUnit={resUnit}
                reservations={reservationUnitReservations.filter(
                  (res) => res.state === "confirmed"
                )}
              />
              {hasCancelations ? (
                <>
                  <P />
                  <P />
                  <Text>
                    Vuorojenjaossa on seuraavat poikkeukset, jolloin vakiovuoro
                    ei ole käytettävissänne:
                  </Text>
                  <P />
                  <ReservationsTable
                    applicationEvent={applicationEvent}
                    reservationUnit={resUnit}
                    reservations={reservationUnitReservations.filter(
                      (res) => res.state !== "confirmed"
                    )}
                  />
                </>
              ) : null}
            </PDFPage>
          );
        });
      }
    )}
  </PDFDocument>
);

export default ReservationsDocument;
