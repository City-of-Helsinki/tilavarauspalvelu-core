import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { useForm } from "react-hook-form";
import { Button, IconArrowRight, IconCross, IconSignout } from "hds-react";
import { useTranslation } from "next-i18next";
import { fontMedium, H1 } from "common/src/common/typography";
import {
  useCancelReservationMutation,
  type ReservationQuery,
  type ReservationCancelReasonsQuery,
} from "@gql/gql-types";
import { IconButton } from "common/src/components";
import Sanitize from "../common/Sanitize";
import { ReservationInfoCard } from "./ReservationInfoCard";
import { signOut } from "common/src/browserHelpers";
import { ReservationPageWrapper } from "../reservations/styles";
import {
  convertLanguageCode,
  getTranslationSafe,
} from "common/src/common/util";
import { errorToast } from "common/src/common/toast";
import { ControlledSelect } from "common/src/components/form";
import { AutoGrid, ButtonContainer, Flex } from "common/styles/util";
import { ButtonLikeLink } from "../common/ButtonLikeLink";
import { getReservationPath } from "@/modules/urls";
import TermsBox from "common/src/termsbox/TermsBox";
import { AccordionWithState } from "../Accordion";
import { breakpoints } from "common";
import Error from "next/error";

type CancelReasonsQ = NonNullable<
  ReservationCancelReasonsQuery["reservationCancelReasons"]
>;
type CancelReasonsEdge = NonNullable<CancelReasonsQ["edges"]>;
type CancelReasonsNode = NonNullable<
  NonNullable<CancelReasonsEdge[number]>["node"]
>;
type NodeT = ReservationQuery["reservation"];
type Props = {
  apiBaseUrl: string;
  reasons: CancelReasonsNode[];
  reservation: NonNullable<NodeT>;
};

const Actions = styled(ButtonContainer).attrs({
  $justifyContent: "space-between",
})`
  grid-column: 1 / -1;
`;

const Form = styled.form`
  label {
    ${fontMedium};
  }
`;

function ReturnLinkList({ apiBaseUrl }: { apiBaseUrl: string }): JSX.Element {
  const { t } = useTranslation();
  return (
    <Flex $gap="none" $alignItems="flex-start">
      <IconButton
        href="/reservations"
        label={t("reservations:gotoReservations")}
        icon={<IconArrowRight aria-hidden />}
      />
      <IconButton
        href="/"
        label={t("common:gotoFrontpage")}
        icon={<IconArrowRight aria-hidden />}
      />
      <IconButton
        icon={<IconSignout aria-hidden />}
        onClick={() => signOut(apiBaseUrl)}
        label={t("common:logout")}
      />
    </Flex>
  );
}

type FormValues = {
  reason: number;
  description?: string;
};

const StyledInfoCard = styled(ReservationInfoCard)`
  @media (min-width: ${breakpoints.m}) {
    grid-row: 1 / -1;
    grid-column: 2;
  }
`;

export function ReservationCancellation(props: Props): JSX.Element {
  const [isSuccess, setIsSuccess] = useState(false);
  const { t } = useTranslation();

  const { reservation } = props;

  const title = !isSuccess
    ? t("reservations:cancelReservation")
    : t("reservations:reservationCancelledTitle");
  const ingress = !isSuccess
    ? t("reservations:cancelReservationBody")
    : t("reservations:reservationCancelledBody");

  const handleNext = () => {
    setIsSuccess(true);
  };

  // TODO check that the reservation hasn't been cancelled already

  return (
    <ReservationPageWrapper>
      <div>
        <H1 $noMargin>{title}</H1>
        <p>{ingress}</p>
      </div>
      {/* TODO replace this if part of an application */}
      <StyledInfoCard reservation={reservation} type="confirmed" />
      <Flex>
        {!isSuccess ? (
          <CancellationForm {...props} onNext={handleNext} />
        ) : (
          <CancellationSuccess {...props} />
        )}
      </Flex>
    </ReservationPageWrapper>
  );
}

function CancellationForm(props: Props & { onNext: () => void }): JSX.Element {
  const { reservation, onNext } = props;
  const { t, i18n } = useTranslation();
  const lang = convertLanguageCode(i18n.language);

  const reasons = props.reasons.map((node) => ({
    label: getTranslationSafe(node, "reason", lang),
    value: node?.pk ?? 0,
  }));

  const [cancelReservation, { loading }] = useCancelReservationMutation();

  const form = useForm<FormValues>();
  const { register, handleSubmit, watch, control } = form;

  useEffect(() => {
    register("reason", { required: true });
    register("description");
  }, [register]);
  const reservationUnit = reservation.reservationUnits.find(() => true);

  const onSubmit = (formData: FormValues) => {
    if (!reservation.pk || !formData.reason) {
      return;
    }
    const { reason, description } = formData;
    try {
      cancelReservation({
        variables: {
          input: {
            pk: reservation.pk,
            cancelReason: reason,
            cancelDetails: description,
          },
        },
      });
      // TODO redirect to a success page (or back to the reservation page with a toast is preferable)
      onNext();
      window.scrollTo(0, 0);
    } catch (e) {
      errorToast({
        text: t("reservations:reservationCancellationFailed"),
      });
    }
  };

  const cancellationTerms =
    reservationUnit?.cancellationTerms != null
      ? getTranslationSafe(reservationUnit?.cancellationTerms, "text", lang)
      : null;

  return (
    <>
      <p style={{ margin: 0 }}>{t("reservations:cancelInfoBody")}</p>
      {cancellationTerms != null && (
        <AccordionWithState
          heading={t("reservationUnit:cancellationTerms")}
          disableBottomMargin
        >
          <TermsBox body={<Sanitize html={cancellationTerms ?? ""} />} />
        </AccordionWithState>
      )}
      <Form onSubmit={handleSubmit(onSubmit)}>
        <AutoGrid>
          <ControlledSelect
            name="reason"
            control={control}
            label={t("reservations:cancelReason")}
            options={reasons}
            required
          />
          <Actions>
            <ButtonLikeLink
              data-testid="reservation-cancel__button--back"
              href={getReservationPath(reservation.pk)}
            >
              <IconCross aria-hidden="true" />
              {t("reservations:cancelReservationCancellation")}
            </ButtonLikeLink>
            <Button
              variant="primary"
              type="submit"
              disabled={!watch("reason")}
              data-testid="reservation-cancel__button--cancel"
              isLoading={loading}
            >
              {t("reservations:cancelReservation")}
            </Button>
          </Actions>
        </AutoGrid>
      </Form>
    </>
  );
}

function CancellationSuccess(props: Props): JSX.Element {
  const { apiBaseUrl } = props;
  const reservationUnit = props.reservation.reservationUnits.find(() => true);
  const { i18n } = useTranslation();
  const lang = convertLanguageCode(i18n.language);

  // Should never happen but we can't enforce it in the type system
  if (reservationUnit == null) {
    return <Error statusCode={404} />;
  }

  const instructions = getTranslationSafe(
    reservationUnit,
    "reservationCancelledInstructions",
    lang
  );

  return (
    <>
      {instructions && <p>{instructions}</p>}
      <ReturnLinkList apiBaseUrl={apiBaseUrl} />
    </>
  );
}
