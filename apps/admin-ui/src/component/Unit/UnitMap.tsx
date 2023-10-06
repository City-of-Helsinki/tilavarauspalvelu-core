import { useQuery } from "@apollo/client";
import React from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import { Query, QueryUnitByPkArgs } from "common/types/gql-types";
import { useNotification } from "@/context/NotificationContext";
import { UNIT_QUERY } from "../../common/queries";
import { ContentContainer } from "../../styles/layout";
import Loader from "../Loader";
import Map from "./Map";
import SubPageHead from "./SubPageHead";

interface IProps {
  [key: string]: string;
  unitPk: string;
}

const UnitMap = (): JSX.Element => {
  const { notifyError } = useNotification();
  const { t } = useTranslation();
  const unitPk = Number(useParams<IProps>().unitPk);

  const { data, loading: isLoading } = useQuery<Query, QueryUnitByPkArgs>(
    UNIT_QUERY,
    {
      variables: { pk: unitPk },
      onError: () => {
        notifyError("errors.errorFetchingData");
      },
    }
  );

  const unit = data?.unitByPk ?? undefined;

  if (isLoading || !unit) {
    return <Loader />;
  }

  const markers = [];

  if (unit.location) {
    markers.push({
      latitude: Number(unit.location.latitude),
      longitude: Number(unit.location.longitude),
    });
  }

  return (
    <div>
      <SubPageHead title={t("Unit.location")} unit={unit} />
      <ContentContainer>
        <Map markers={markers} />
      </ContentContainer>
    </div>
  );
};

export default UnitMap;
