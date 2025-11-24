import React from "react";
import { useForm } from "react-hook-form";
import { Button, ButtonVariant, IconCross, LoadingSpinner } from "hds-react";
import { useTranslation } from "next-i18next";
import styled from "styled-components";
import { ButtonLikeLink } from "ui/src/components/ButtonLikeLink";
import { Sanitize } from "ui/src/components/Sanitize";
import { TermsBox } from "ui/src/components/TermsBox";
import { ControlledSelect } from "ui/src/components/form";
import { breakpoints } from "ui/src/modules/const";
import { AutoGrid, ButtonContainer, Flex, fontMedium } from "ui/src/styled";
import { ReservationCancelReasonChoice } from "@gql/gql-types";
import { AccordionWithState } from "./Accordion";

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

export type CancelFormValues = {
  reason: ReservationCancelReasonChoice;
};

const FormWrapper = styled(Flex)`
  @media (min-width: ${breakpoints.m}) {
    grid-row: 2 / -1;
    grid-column: 1;
  }
`;

export function CancellationForm(props: {
  onNext: (values: CancelFormValues) => void;
  cancellationTerms: string | null;
  backLink: string;
  isLoading?: boolean;
  isDisabled?: boolean;
}): JSX.Element {
  const { onNext, isLoading, isDisabled, cancellationTerms, backLink } = props;
  const { t } = useTranslation();

  const reasons = Object.values(ReservationCancelReasonChoice)
    .map((r) => ({
      label: t(`reservation:cancel.reasons.${r}`),
      value: r,
    }))
    .filter((r) => r.value !== ReservationCancelReasonChoice.NotPaid);

  const form = useForm<CancelFormValues>();
  const { handleSubmit, watch, control } = form;

  return (
    <FormWrapper>
      {cancellationTerms != null && (
        <AccordionWithState heading={t("reservationUnit:cancellationTerms")} disableBottomMargin>
          <TermsBox body={<Sanitize html={cancellationTerms} />} />
        </AccordionWithState>
      )}
      <Form onSubmit={handleSubmit(onNext)}>
        <AutoGrid>
          <ControlledSelect
            id="reservation-cancel__reason"
            name="reason"
            control={control}
            label={t("reservation:cancel.reason")}
            options={reasons}
            required
            disabled={isDisabled}
          />
          <Actions>
            <ButtonLikeLink data-testid="reservation-cancel__button--back" href={backLink} size="large">
              <IconCross aria-hidden="true" />
              {t("common:stop")}
            </ButtonLikeLink>
            <Button
              type="submit"
              variant={isLoading ? ButtonVariant.Clear : ButtonVariant.Primary}
              iconStart={isLoading ? <LoadingSpinner small /> : undefined}
              disabled={isDisabled || isLoading || !watch("reason")}
              data-testid="reservation-cancel__button--cancel"
            >
              {t("reservation:cancel.reservation")}
            </Button>
          </Actions>
        </AutoGrid>
      </Form>
    </FormWrapper>
  );
}
