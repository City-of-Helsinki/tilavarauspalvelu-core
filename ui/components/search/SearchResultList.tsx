import { Notification as HDSNotification } from "hds-react";
import React from "react";
import { useTranslation } from "next-i18next";
import styled from "styled-components";
import useReservationUnitsList from "../../hooks/useReservationUnitList";
import { ReservationUnit } from "../../modules/types";
import Container from "../common/Container";
import StartApplicationBar from "../../components/common/StartApplicationBar";
import ReservationUnitCard from "./ReservationUnitCard";

interface Props {
  reservationUnits: ReservationUnit[] | null;
  error: boolean;
}

const HitCount = styled.div`
  margin-top: var(--spacing-layout-s);
  font-weight: 700;
  font-size: var(--fontsize-heading-m);
`;

const ListContainer = styled.div`
  margin-top: var(--spacing-layout-s);
`;

const Notification = styled(HDSNotification)`
  margin-top: 2em;
`;

const SearchResultList = ({ error, reservationUnits }: Props): JSX.Element => {
  const {
    reservationUnits: selectedReservationUnits,
    selectReservationUnit,
    removeReservationUnit,
    containsReservationUnit,
  } = useReservationUnitsList();

  const { t } = useTranslation();
  return (
    <>
      <Container id="searchResultList">
        {error ? (
          <Notification size="small" type="alert">
            {t("searchResultList:error")}
          </Notification>
        ) : null}
        {reservationUnits !== null ? (
          <>
            <HitCount>
              {reservationUnits.length
                ? t("searchResultList:count", {
                    count: reservationUnits.length,
                  })
                : t("searchResultList:noResults")}
            </HitCount>
            <ListContainer>
              {reservationUnits.map((ru) => (
                <ReservationUnitCard
                  selectReservationUnit={selectReservationUnit}
                  containsReservationUnit={containsReservationUnit}
                  removeReservationUnit={removeReservationUnit}
                  reservationUnit={ru}
                  key={ru.id}
                />
              ))}
            </ListContainer>
          </>
        ) : null}
      </Container>
      <StartApplicationBar count={selectedReservationUnits.length} />
    </>
  );
};

export default SearchResultList;
