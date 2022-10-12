import { useQuery } from "@apollo/client";
import { H1 } from "common/src/common/typography";
import React from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { Query, QueryUnitsArgs, UnitType } from "../../common/gql-types";
import { useNotification } from "../../context/NotificationContext";
import BreadcrumbWrapper from "../BreadcrumbWrapper";
import Loader from "../Loader";
import { UNITS_QUERY } from "../Unit/queries";
import withMainMenu from "../withMainMenu";
import MyUnitCard from "./MyUnitCard";

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--spacing-layout-2-xs);

  padding: var(--spacing-layout-2-xs) 0 var(--spacing-layout-m)
    var(--spacing-layout-m);
  max-width: var(--container-width-l);
`;

const Grid = styled.div`
  display: grid;
  gap: var(--spacing-s);
  grid-template-columns: 1fr 1fr;
`;

const MyUnits = () => {
  const { t } = useTranslation();
  const { notifyError } = useNotification();

  const { loading, data } = useQuery<Query, QueryUnitsArgs>(UNITS_QUERY, {
    variables: {
      orderBy: "nameFi",
      offset: 0,
    },
    onError: (err) => {
      notifyError(err.message);
    },
    fetchPolicy: "cache-and-network",
  });

  if (loading) {
    return <Loader />;
  }

  return (
    <>
      <BreadcrumbWrapper route={["my-units"]} />
      <Wrapper>
        <div>
          <H1>{t("MyUnits.heading")}</H1>
          <p>{t("MyUnits.description")}</p>
        </div>
        <Grid>
          {data?.units?.edges.map((unit) => (
            <MyUnitCard unit={unit?.node as UnitType} />
          ))}
        </Grid>
      </Wrapper>
    </>
  );
};

export default withMainMenu(MyUnits);
