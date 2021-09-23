import { useQuery } from "@apollo/client";
import { Notification } from "hds-react";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import styled from "styled-components";

import { UNIT_QUERY } from "../../common/queries";
import { UnitType } from "../../common/types";
import { ContentContainer } from "../../styles/layout";
import Loader from "../Loader";
import withMainMenu from "../withMainMenu";
import Map from "./Map";
import SubPageHead from "./SubPageHead";

interface IProps {
  unitId: string;
}

const Wrapper = styled.div``;

const UnitMap = (): JSX.Element => {
  const [isLoading, setIsLoading] = useState(true);
  const [unit, setUnit] = useState<UnitType>();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { t } = useTranslation();
  const { unitId } = useParams<IProps>();

  useQuery(UNIT_QUERY, {
    variables: { pk: unitId },
    onCompleted: ({ unitByPk }: { unitByPk: UnitType }) => {
      setUnit(unitByPk);
      setIsLoading(false);
    },
    onError: () => {
      setErrorMsg("errors.errorFetchingData");
      setIsLoading(false);
    },
  });

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
    <Wrapper>
      <SubPageHead title={t("Unit.location")} unit={unit} />
      <ContentContainer>
        <Map markers={markers} />
      </ContentContainer>
      {errorMsg && (
        <Notification
          type="error"
          label={t("errors.functionFailed")}
          position="top-center"
          autoClose={false}
          dismissible
          closeButtonLabelText={t("common.close")}
          displayAutoCloseProgress={false}
          onClose={() => setErrorMsg(null)}
        >
          {t(errorMsg)}
        </Notification>
      )}
    </Wrapper>
  );
};

export default withMainMenu(UnitMap);
