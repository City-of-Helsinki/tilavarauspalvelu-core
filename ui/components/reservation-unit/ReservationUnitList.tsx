import { IconPlusCircle, Notification as HDSNotification } from "hds-react";
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { sortBy } from "lodash";
import styled from "styled-components";
import { ApplicationEvent, OptionType } from "../../modules/types";
import Modal from "../common/Modal";
import ReservationUnitModal from "./ReservationUnitModal";
import ReservationUnitCard from "./ReservationUnitCard";
import { MediumButton } from "../../styles/util";
import {
  ApplicationRoundType,
  Query,
  QueryReservationUnitsArgs,
  ReservationUnitByPkType,
  ReservationUnitType,
} from "../../modules/gql-types";
import { RESERVATION_UNITS } from "../../modules/queries/reservationUnit";
import apolloClient from "../../modules/apolloClient";
import { CenterSpinner } from "../common/common";

type OptionTypes = {
  purposeOptions: OptionType[];
  reservationUnitTypeOptions: OptionType[];
  participantCountOptions: OptionType[];
};

type Props = {
  selectedReservationUnits: ReservationUnitType[] | ReservationUnitByPkType;
  applicationEvent: ApplicationEvent;
  fieldName: string;
  form: ReturnType<typeof useForm>;
  applicationRound: ApplicationRoundType;
  options: OptionTypes;
  minSize?: number;
};

const MainContainer = styled.div`
  margin-top: var(--spacing-l);
`;

const ButtonContainer = styled.div`
  margin-top: var(--spacing-layout-m);
`;

const Notification = styled(HDSNotification)`
  --notification-z-index: 0 !important;
`;

const ReservationUnitList = ({
  selectedReservationUnits,
  applicationEvent,
  form,
  fieldName,
  applicationRound,
  options,
  minSize,
}: Props): JSX.Element => {
  const [showModal, setShowModal] = useState(false);
  const [reservationUnits, setReservationUnits] = useState<
    ReservationUnitType[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);

  const handleAdd = (ru: ReservationUnitType) => {
    setReservationUnits([...reservationUnits, ru]);
  };

  const isValid = (units: ReservationUnitType[]) => {
    const error = units
      .map((resUnit) => minSize && resUnit.maxPersons < minSize)
      .find((a) => a);
    return !error;
  };

  useEffect(() => {
    form.setValue(
      fieldName,
      reservationUnits.map((resUnit, index) => {
        return {
          reservationUnitId: resUnit.pk,
          priority: index,
          maxPersons: resUnit.maxPersons,
        };
      })
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reservationUnits]);

  useEffect(() => {
    const valid = isValid(reservationUnits);
    if (valid) {
      form.clearErrors([fieldName]);
    } else {
      form.setError(fieldName, { type: "reservationUnitTooSmall" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reservationUnits, minSize]);

  useEffect(() => {
    let isMounted = true;
    let data;
    const fetchData = async () => {
      setIsLoading(true);
      if (applicationEvent.eventReservationUnits?.length === 0) {
        data = selectedReservationUnits;
      } else {
        const eventUniIds = sortBy(
          applicationEvent.eventReservationUnits,
          "priority"
        ).map((n) => n.reservationUnitId);
        const { data: reservationUnitData } = await apolloClient.query<
          Query,
          QueryReservationUnitsArgs
        >({
          query: RESERVATION_UNITS,
          fetchPolicy: "no-cache",
          variables: {
            pk: eventUniIds.map(String),
          },
        });
        data = reservationUnitData?.reservationUnits?.edges
          .map((n) => n.node)
          .filter((n) => eventUniIds.includes(n.pk))
          .sort(
            (a, b) => eventUniIds.indexOf(a.pk) - eventUniIds.indexOf(b.pk)
          );
      }
      if (isMounted) {
        setReservationUnits(
          data.filter((ru) =>
            applicationRound.reservationUnits.map((n) => n.pk).includes(ru.pk)
          )
        );
        setIsLoading(false);
      }
    };

    fetchData();
    return () => {
      isMounted = false;
    };
  }, [
    selectedReservationUnits,
    applicationEvent.eventReservationUnits,
    applicationRound,
  ]);

  const move = (
    units: ReservationUnitType[],
    from: number,
    to: number
  ): ReservationUnitType[] => {
    const copy = [...units];
    const i = units[from];
    copy.splice(from, 1);
    copy.splice(to, 0, i);
    return copy;
  };

  const remove = (reservationUnit: ReservationUnitType) => {
    setReservationUnits([
      ...reservationUnits.filter((ru) => ru.pk !== reservationUnit.pk),
    ]);
  };

  const moveUp = (reservationUnit: ReservationUnitType) => {
    const from = reservationUnits.indexOf(reservationUnit);
    const to = from - 1;
    setReservationUnits(move(reservationUnits, from, to));
  };

  const moveDown = (reservationUnit: ReservationUnitType) => {
    const from = reservationUnits.indexOf(reservationUnit);
    const to = from + 1;
    setReservationUnits(move(reservationUnits, from, to));
  };

  const { t } = useTranslation();

  if (isLoading) {
    return <CenterSpinner />;
  }

  return (
    <MainContainer>
      <Notification
        size="small"
        label={t("reservationUnitList:infoReservationUnits")}
      >
        {t("reservationUnitList:infoReservationUnits")}
      </Notification>
      {reservationUnits.map((ru, index, all) => {
        return (
          <ReservationUnitCard
            key={ru.pk}
            invalid={(minSize && ru.maxPersons < minSize) || false}
            onDelete={remove}
            reservationUnit={ru}
            order={index}
            first={index === 0}
            last={index === all.length - 1}
            onMoveDown={moveDown}
            onMoveUp={moveUp}
          />
        );
      })}
      <ButtonContainer>
        <MediumButton
          variant="supplementary"
          iconLeft={<IconPlusCircle aria-hidden />}
          onClick={() => setShowModal(true)}
        >
          {t("reservationUnitList:add")}
        </MediumButton>
      </ButtonContainer>
      <Modal
        handleClose={() => {
          setShowModal(false);
        }}
        show={showModal}
        closeButtonKey="reservationUnitModal:returnToApplication"
      >
        <ReservationUnitModal
          currentReservationUnits={reservationUnits}
          applicationRound={applicationRound}
          handleAdd={handleAdd}
          handleRemove={remove}
          options={options}
        />
      </Modal>
    </MainContainer>
  );
};

export default ReservationUnitList;
