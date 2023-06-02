import React from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import withMainMenu from "../withMainMenu";
import EditPageWrapper from "./EditPageWrapper";
import { useReservationEditData } from "./requested/hooks";
import Loader from "../Loader";

const EditTime = () => {
  return <div>TODO add a widget to edit the time of the reservation</div>;
};

const EditTimePage = () => {
  const params = useParams();
  const id = params.id ?? undefined;

  const { t } = useTranslation("translation", {
    keyPrefix: "Reservation.EditTime",
  });

  const { reservation, loading } = useReservationEditData(id);

  return (
    <EditPageWrapper reservation={reservation} title={t("title")}>
      {loading ? <Loader /> : <EditTime />}
    </EditPageWrapper>
  );
};

export default withMainMenu(EditTimePage);
