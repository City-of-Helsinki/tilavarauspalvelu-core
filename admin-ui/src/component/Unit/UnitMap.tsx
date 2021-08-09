import { Notification } from "hds-react";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import styled from "styled-components";
import { getUnit } from "../../common/api";
import { UnitWIP } from "../../common/types";
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
  const [unit, setUnit] = useState<UnitWIP>();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { t } = useTranslation();
  const { unitId } = useParams<IProps>();
  useEffect(() => {
    const fetchUnit = async () => {
      try {
        const result = await getUnit(Number(unitId));
        setUnit(result);
      } catch (error) {
        setErrorMsg("errors.errorFetchingData");
      } finally {
        setIsLoading(false);
      }
    };

    fetchUnit();
  }, [unitId]);

  if (isLoading || !unit) {
    return <Loader />;
  }

  return (
    <Wrapper>
      <SubPageHead title={t("Unit.location")} unit={unit} />
      <ContentContainer>
        <Map
          id={String(unit.id)}
          latitude={unit.location.latitude}
          longitude={unit.location.longitude}
        />
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
