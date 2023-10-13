import { IconPlusCircle, Notification as HDSNotification } from "hds-react";
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "next-i18next";
import { isEqual, sortBy } from "lodash";
import styled from "styled-components";
import { ApplicationEvent, OptionType } from "common/types/common";
import {
  ApplicationRoundType,
  Query,
  QueryReservationUnitsArgs,
  ReservationUnitType,
} from "common/types/gql-types";
import { IconButton } from "common/src/components";
import Modal from "../common/Modal";
import ReservationUnitModal from "./ReservationUnitModal";
import ReservationUnitCard from "./ReservationUnitCard";
import { RESERVATION_UNITS } from "../../modules/queries/reservationUnit";
import { createApolloClient } from "../../modules/apolloClient";
import { CenterSpinner } from "../common/common";

type OptionTypes = {
  purposeOptions: OptionType[];
  reservationUnitTypeOptions: OptionType[];
  participantCountOptions: OptionType[];
  unitOptions: OptionType[];
};

type Props = {
  selectedReservationUnits: ReservationUnitType[];
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
      .map(
        (resUnit) =>
          minSize != null &&
          resUnit.maxPersons != null &&
          resUnit.maxPersons < minSize
      )
      .find((a) => a);
    return !error;
  };

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
    let data: ReservationUnitType[] = [];
    const fetchData = async () => {
      setIsLoading(true);
      if (applicationEvent.eventReservationUnits?.length === 0) {
        data = selectedReservationUnits;
      } else {
        const eventUniIds = sortBy(
          applicationEvent.eventReservationUnits,
          "priority"
        ).map((n) => n.reservationUnitId);
        // TODO why is this using client directly instead of apollo context with useQuery?
        const apolloClient = createApolloClient(undefined);
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
        data =
          reservationUnitData?.reservationUnits?.edges
            .map((n) => n?.node)
            .filter((n) => n?.pk != null && eventUniIds.includes(n.pk))
            .filter((n): n is ReservationUnitType => n != null)
            .sort((a, b) =>
              a?.pk != null && b?.pk != null
                ? eventUniIds.indexOf(a.pk) - eventUniIds.indexOf(b.pk)
                : 0
            ) ?? [];
      }
      if (isMounted) {
        setReservationUnits(
          data.filter((ru) =>
            applicationRound.reservationUnits?.map((n) => n?.pk).includes(ru.pk)
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

  useEffect(() => {
    if (isLoading) {
      return;
    }
    const newReservationUnits = reservationUnits.map((resUnit, index) => {
      return {
        reservationUnitId: resUnit.pk,
        priority: index,
        maxPersons: resUnit.maxPersons,
      };
    });

    if (isEqual(newReservationUnits, form.getValues(fieldName))) {
      return;
    }

    form.setValue(fieldName, newReservationUnits);
  }, [isLoading, reservationUnits, fieldName, form]);

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
            invalid={
              minSize != null &&
              ru.maxPersons != null &&
              minSize > ru.maxPersons
            }
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
        <IconButton
          onClick={() => setShowModal(true)}
          icon={<IconPlusCircle aria-hidden />}
          label={t("reservationUnitList:add")}
        />
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
