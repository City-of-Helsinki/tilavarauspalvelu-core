import React, { useEffect } from "react";
import styled, { css } from "styled-components";
import { useForm } from "react-hook-form";
import {
  Button,
  IconClock,
  IconCross,
  IconEuroSign,
  IconLocation,
} from "hds-react";
import { useTranslation } from "next-i18next";
import { fontMedium, H1, H4 } from "common/src/common/typography";
import {
  useCancelReservationMutation,
  type ReservationCancelPageQuery,
} from "@gql/gql-types";
import Sanitize from "../common/Sanitize";
import { ReservationInfoCard } from "./ReservationInfoCard";
import { ReservationPageWrapper } from "../reservations/styles";
import {
  convertLanguageCode,
  getTranslationSafe,
  toUIDate,
} from "common/src/common/util";
import { errorToast } from "common/src/common/toast";
import { ControlledSelect } from "common/src/components/form";
import { AutoGrid, ButtonContainer, Flex } from "common/styles/util";
import { ButtonLikeLink } from "../common/ButtonLikeLink";
import { getApplicationPath, getReservationPath } from "@/modules/urls";
import TermsBox from "common/src/termsbox/TermsBox";
import { AccordionWithState } from "../Accordion";
import { breakpoints } from "common";
import { getPrice } from "@/modules/reservationUnit";
import { formatDateTimeStrings } from "@/modules/util";
import { LocalizationLanguages } from "common/src/helpers";
import { useRouter } from "next/router";

type CancelReasonsQ = NonNullable<
  ReservationCancelPageQuery["reservationCancelReasons"]
>;
type CancelReasonsEdge = NonNullable<CancelReasonsQ["edges"]>;
type CancelReasonsNode = NonNullable<
  NonNullable<CancelReasonsEdge[number]>["node"]
>;
type NodeT = ReservationCancelPageQuery["reservation"];
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

type FormValues = {
  reason: number;
  description?: string;
};

const infoCss = css`
  @media (min-width: ${breakpoints.m}) {
    grid-row: 1 / -1;
    grid-column: 2;
  }
`;

const StyledInfoCard = styled(ReservationInfoCard)`
  ${infoCss}
`;

const ApplicationInfo = styled(Flex).attrs({ $gap: "2-xs" })`
  background-color: var(--color-silver-light);
  padding: var(--spacing-m);
  ${infoCss}
`;

const IconList = styled(Flex).attrs({
  $gap: "2-xs",
})`
  list-style: none;
  padding: 0;
  margin: var(--spacing-2-xs) 0 0;
  li {
    display: flex;
    gap: var(--spacing-xs);
    align-items: center;
  }
`;

export function ReservationCancellation(props: Props): JSX.Element {
  const { t } = useTranslation();
  const router = useRouter();

  const { reservation } = props;

  const handleNext = () => {
    const redirectUrl = getBackPath(reservation);
    if (isPartOfApplication(reservation)) {
      if (redirectUrl) {
        router.push(`${redirectUrl}?deletedReservationPk=${reservation.pk}`);
      }
    } else if (redirectUrl) {
      router.push(`${redirectUrl}?deleted=true`);
    }
  };

  const isApplication = isPartOfApplication(reservation);
  const title = t("reservations:cancel.reservation");
  const ingress = isApplication
    ? t("reservations:cancel.ingressApplication")
    : t("reservations:cancel.ingress");
  const infoBody = isApplication
    ? t("reservations:cancel.infoBodyApplication")
    : t("reservations:cancel.infoBody");

  return (
    <ReservationPageWrapper>
      <div>
        <H1 $noMargin>{title}</H1>
        <p>{ingress}</p>
        <p>{infoBody}</p>
      </div>
      {reservation.recurringReservation ? (
        <ApplicationInfoCard reservation={reservation} />
      ) : (
        <StyledInfoCard reservation={reservation} type="confirmed" />
      )}
      <Flex>
        <CancellationForm {...props} onNext={handleNext} />
      </Flex>
    </ReservationPageWrapper>
  );
}

function ApplicationInfoCard({
  reservation,
}: {
  reservation: Props["reservation"];
}) {
  // NOTE assumes that the name of the recurringReservation is copied from applicationSection when it's created
  const name = reservation.recurringReservation?.name;
  const reservationUnit = reservation.reservationUnits.find(() => true);
  const { t, i18n } = useTranslation();
  const lang = convertLanguageCode(i18n.language);
  const reservationUnitName =
    reservationUnit != null
      ? getTranslationSafe(reservationUnit, "name", lang)
      : "-";
  const price = getPrice(t, reservation, lang);

  const { dayOfWeek, time, date } = formatDateTimeStrings(
    t,
    reservation,
    undefined,
    true
  );

  const icons = [
    {
      text: time,
      icon: <IconClock aria-hidden="true" />,
    },
    {
      icon: <IconLocation aria-hidden="true" />,
      text: reservationUnitName,
    },
    {
      icon: <IconEuroSign aria-hidden="true" />,
      text: price,
    },
  ];

  return (
    <ApplicationInfo>
      <H4 as="h2" $noMargin>
        {name}
      </H4>
      <div>
        {toUIDate(date)}
        {" - "}
        {dayOfWeek}
      </div>
      <IconList>
        {icons.map(({ text, icon }) => (
          <li key={text}>
            {icon}
            {text}
          </li>
        ))}
      </IconList>
    </ApplicationInfo>
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

  const onSubmit = async (formData: FormValues) => {
    if (!reservation.pk || !formData.reason) {
      return;
    }
    const { reason, description } = formData;
    try {
      await cancelReservation({
        variables: {
          input: {
            pk: reservation.pk,
            cancelReason: reason,
            cancelDetails: description,
          },
        },
      });
      onNext();
    } catch (e) {
      errorToast({
        text: t("reservations:cancel.mutationFailed"),
      });
    }
  };

  const cancellationTerms = getTranslatedTerms(reservation, lang);
  const backLink = getBackPath(reservation);

  return (
    <>
      {cancellationTerms != null && (
        <AccordionWithState
          heading={t("reservationUnit:cancellationTerms")}
          disableBottomMargin
        >
          <TermsBox body={<Sanitize html={cancellationTerms} />} />
        </AccordionWithState>
      )}
      <Form onSubmit={handleSubmit(onSubmit)}>
        <AutoGrid>
          <ControlledSelect
            name="reason"
            control={control}
            label={t("reservations:cancel.reason")}
            options={reasons}
            required
          />
          <Actions>
            <ButtonLikeLink
              data-testid="reservation-cancel__button--back"
              href={backLink}
            >
              <IconCross aria-hidden="true" />
              {t("reservations:cancelButton")}
            </ButtonLikeLink>
            <Button
              variant="primary"
              type="submit"
              disabled={!watch("reason")}
              data-testid="reservation-cancel__button--cancel"
              isLoading={loading}
            >
              {t("reservations:cancel.reservation")}
            </Button>
          </Actions>
        </AutoGrid>
      </Form>
    </>
  );
}

function isPartOfApplication(reservation: NodeT): boolean {
  return reservation?.recurringReservation != null;
}

function getBackPath(reservation: NodeT): string {
  if (reservation == null) {
    return "";
  }
  if (isPartOfApplication(reservation)) {
    const applicationPk =
      reservation.recurringReservation?.allocatedTimeSlot?.reservationUnitOption
        .applicationSection.application.pk;
    return getApplicationPath(applicationPk, "view");
  }
  return getReservationPath(reservation.pk);
}

/// For applications use application round terms of use
function getTranslatedTerms(
  reservation: Props["reservation"],
  lang: LocalizationLanguages
) {
  if (reservation.recurringReservation) {
    const round =
      reservation.recurringReservation?.allocatedTimeSlot?.reservationUnitOption
        ?.applicationSection?.application?.applicationRound;
    const { termsOfUse } = round ?? {};
    if (termsOfUse) {
      return getTranslationSafe(termsOfUse, "text", lang);
    }
    return null;
  }
  const reservationUnit = reservation.reservationUnits.find(() => true);
  if (reservationUnit?.cancellationTerms != null) {
    return getTranslationSafe(reservationUnit?.cancellationTerms, "text", lang);
  }
  return null;
}
