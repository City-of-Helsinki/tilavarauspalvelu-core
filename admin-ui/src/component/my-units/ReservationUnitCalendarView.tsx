import { useQuery } from "@apollo/client";
import { H1 } from "common/src/common/typography";
import React, { useState } from "react";
import { useHistory, useParams } from "react-router-dom";
import { addDays, subDays } from "date-fns";
import { intersection } from "lodash";
import {
  LocationType,
  Query,
  QueryUnitsArgs,
  ReservationUnitType,
} from "../../common/gql-types";
import { useNotification } from "../../context/NotificationContext";
import BreadcrumbWrapper from "../BreadcrumbWrapper";
import Loader from "../Loader";
import withMainMenu from "../withMainMenu";
import { UNIT_QUERY } from "./queries";
import { parseAddress } from "../../common/util";
import SingleReservationUnitFilter from "../filters/SingleReservationUnitFilter";
import { Container, Grid, HorisontalFlex, Span4 } from "../../styles/layout";
import ReservationUnitCalendar from "./ReservationUnitCalendar";
import WeekNavigation from "./WeekNavigation";
import { myReservationUnitUrl } from "../../common/urls";
import { publicUrl } from "../../common/const";

type Params = {
  unitId: string;
  reservationUnitId: string;
};

const intersectingReservationUnits = (
  allReservationUnits: ReservationUnitType[],
  currentReservationUnit: string
): number[] => {
  const spacePks = allReservationUnits
    .filter((ru) => ru.pk === Number(currentReservationUnit))
    .flatMap((ru) => ru.spaces?.map((space) => space?.pk));

  return allReservationUnits
    .filter(
      (ru) =>
        intersection(
          ru.spaces?.map((space) => space?.pk),
          spacePks
        ).length > 0
    )
    .map((ru) => ru.pk as number);
};

const ReservationUnitCalendarView = () => {
  const { notifyError } = useNotification();
  const [begin, setBegin] = useState(new Date().toISOString());
  const { unitId, reservationUnitId } = useParams<Params>();
  const { push } = useHistory();

  const { loading: unitLoading, data: unitData } = useQuery<
    Query,
    QueryUnitsArgs
  >(UNIT_QUERY, {
    variables: {
      pk: [unitId],
      offset: 0,
    },
    onError: (err) => {
      notifyError(err.message);
    },
  });

  if (unitLoading) {
    return <Loader />;
  }

  const unit = unitData?.units?.edges[0];

  return (
    <>
      <BreadcrumbWrapper
        route={[`${publicUrl}/my-units`, "unit"]}
        aliases={[{ slug: "unit", title: unit?.node?.nameFi as string }]}
      />
      <Container>
        <div>
          <H1>{unit?.node?.nameFi}</H1>
          <p>{parseAddress(unit?.node?.location as LocationType)}</p>
        </div>
        <Grid>
          <Span4>
            <SingleReservationUnitFilter
              unitPk={unitId}
              value={{ value: reservationUnitId, label: "x" }}
              onChange={(ru) => {
                push(myReservationUnitUrl(Number(unitId), Number(ru.value)));
              }}
            />
          </Span4>
        </Grid>
        {reservationUnitId && (
          <>
            <HorisontalFlex style={{ justifyContent: "center" }}>
              <WeekNavigation
                date={begin}
                onPrev={() => {
                  setBegin(subDays(new Date(begin), 7).toISOString());
                }}
                onNext={() => {
                  setBegin(addDays(new Date(begin), 7).toISOString());
                }}
              />
            </HorisontalFlex>
            <ReservationUnitCalendar
              key={begin}
              begin={begin}
              reservationUnitPk={Number(reservationUnitId)}
              intersectingReservationUnits={intersectingReservationUnits(
                unit?.node?.reservationUnits as ReservationUnitType[],
                reservationUnitId
              )}
            />
          </>
        )}
      </Container>
    </>
  );
};

export default withMainMenu(ReservationUnitCalendarView);
