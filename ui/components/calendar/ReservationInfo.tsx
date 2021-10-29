import { useRouter } from "next/router";
import React, { useContext, useEffect, useState } from "react";
import { useTranslation } from "next-i18next";
import styled from "styled-components";
import { differenceInMinutes, parseISO } from "date-fns";
import { Notification } from "hds-react";
import { useMutation } from "@apollo/client";
import { breakpoint } from "../../modules/style";
import { isReservationLongEnough } from "../../modules/calendar";
import { capitalize, formatDurationMinutes } from "../../modules/util";
import { MediumButton } from "../../styles/util";
import {
  ReservationCreateMutationInput,
  ReservationCreateMutationPayload,
  ReservationUnitByPkType,
} from "../../modules/gql-types";
import { DataContext } from "../../context/DataContext";
import { CREATE_RESERVATION } from "../../modules/queries/reservation";

type Props = {
  reservationUnit: ReservationUnitByPkType;
  begin?: string;
  end?: string;
};

const Wrapper = styled.div`
  display: grid;
  gap: var(--spacing-s);
  align-items: flex-start;

  button {
    order: 2;
  }

  h3 {
    margin-top: 0;
  }

  @media (min-width: ${breakpoint.s}) {
    grid-template-columns: auto 1fr;
    gap: var(--spacing-xl);

    button {
      order: 1;
      max-width: 10rem;
    }
  }

  @media (min-width: ${breakpoint.l}) {
    button {
      max-width: unset;
    }
  }
`;

const DurationWrapper = styled.span`
  text-transform: lowercase;
`;

const TimeRange = styled.span``;

const ReservationInfo = ({
  reservationUnit,
  begin,
  end,
}: Props): JSX.Element => {
  const { t } = useTranslation();
  const router = useRouter();
  const { setReservation } = useContext(DataContext);
  const [isRedirecting, setIsRedirecting] = useState<boolean>(false);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [addReservation, { data, loading, error }] = useMutation<
    { createReservation: ReservationCreateMutationPayload },
    { input: ReservationCreateMutationInput }
  >(CREATE_RESERVATION);

  useEffect(() => {
    if (!loading) {
      if (error || data?.createReservation?.errors?.length > 0) {
        setErrorMsg(t("reservationUnit:reservationFailed"));
      } else if (data) {
        setIsRedirecting(true);
        router.push(
          `/reservation-unit/single/${reservationUnit.pk}/reservation`
        );
      }
    }
  }, [data, loading, error, t, router, reservationUnit]);

  const createReservation = () => {
    setErrorMsg(null);
    const input = {
      begin,
      end,
      reservationUnitPks: [reservationUnit.pk],
    };

    addReservation({
      variables: {
        input,
      },
    });
  };

  useEffect(() => {
    setReservation({ pk: null, begin: null, end: null });
  }, [setReservation]);

  useEffect(() => {
    setReservation({ pk: data?.createReservation?.pk, begin, end });
  }, [begin, end, data, setReservation]);

  const beginDate = t("common:dateWithWeekday", {
    date: begin && parseISO(begin),
  });

  const beginTime = t("common:timeWithPrefix", {
    date: begin && parseISO(begin),
  });

  const endDate = t("common:dateWithWeekday", {
    date: end && parseISO(end),
  });

  const endTime = t("common:time", {
    date: end && parseISO(end),
  });

  const duration = differenceInMinutes(new Date(end), new Date(begin));

  const timeRange = `${beginDate} ${beginTime} –${
    endDate !== beginDate ? ` ${endDate}` : ""
  } ${endTime} `;

  return (
    <Wrapper>
      <MediumButton
        onClick={() => {
          createReservation();
        }}
        disabled={
          !begin ||
          !end ||
          !isReservationLongEnough(
            new Date(begin),
            new Date(end),
            reservationUnit.minReservationDuration
          ) ||
          loading ||
          isRedirecting
        }
        data-test="reservation__button--submit"
      >
        {t("reservationCalendar:makeReservation")}
      </MediumButton>
      <div>
        <h3>{t("reservationCalendar:selectedTime")}:</h3>
        {begin && end ? (
          <TimeRange data-test="reservation__selection--timerange">
            {capitalize(timeRange)}
            <DurationWrapper>
              ({formatDurationMinutes(duration)})
            </DurationWrapper>
          </TimeRange>
        ) : (
          "–"
        )}
      </div>
      {errorMsg && (
        <Notification
          type="error"
          label={t("common:error.error")}
          position="top-center"
          autoClose={false}
          displayAutoCloseProgress={false}
          onClose={() => setErrorMsg(null)}
          dismissible
          closeButtonLabelText={t("common:error.closeErrorMsg")}
        >
          {errorMsg}
        </Notification>
      )}
    </Wrapper>
  );
};

export default ReservationInfo;
