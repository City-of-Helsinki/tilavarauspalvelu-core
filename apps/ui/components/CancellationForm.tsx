import React, { useEffect } from "react";
import styled from "styled-components";
import { useForm } from "react-hook-form";
import { Button, IconCross } from "hds-react";
import { useTranslation } from "next-i18next";
import { fontMedium } from "common/src/common/typography";
import { type CancelReasonFieldsFragment } from "@gql/gql-types";
import {
  convertLanguageCode,
  getTranslationSafe,
} from "common/src/common/util";
import { ControlledSelect } from "common/src/components/form";
import { AutoGrid, ButtonContainer, Flex } from "common/styles/util";
import { ButtonLikeLink } from "./common/ButtonLikeLink";
import TermsBox from "common/src/termsbox/TermsBox";
import { AccordionWithState } from "./Accordion";
import { breakpoints } from "common";
import { Sanitize } from "common/src/components/Sanitize";

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
  reason: number;
};

const FormWrapper = styled(Flex)`
  @media (min-width: ${breakpoints.m}) {
    grid-row: 2 / -1;
    grid-column: 1;
  }
`;

export function CancellationForm(props: {
  onNext: (values: CancelFormValues) => void;
  cancelReasons: CancelReasonFieldsFragment[];
  cancellationTerms: string | null;
  backLink: string;
  isLoading?: boolean;
  isDisabled?: boolean;
}): JSX.Element {
  const {
    cancelReasons,
    onNext,
    isLoading,
    isDisabled,
    cancellationTerms,
    backLink,
  } = props;
  const { t, i18n } = useTranslation();
  const lang = convertLanguageCode(i18n.language);

  const reasons = cancelReasons.map((node) => ({
    label: getTranslationSafe(node, "reason", lang),
    value: node?.pk ?? 0,
  }));

  const form = useForm<CancelFormValues>();
  const { register, handleSubmit, watch, control } = form;

  // TODO can we remove this? should be auto registered when the form is created
  // should we add zod schema for the required fields?
  useEffect(() => {
    register("reason", { required: true });
  }, [register]);

  return (
    <FormWrapper>
      {cancellationTerms != null && (
        <AccordionWithState
          heading={t("reservationUnit:cancellationTerms")}
          disableBottomMargin
        >
          <TermsBox body={<Sanitize html={cancellationTerms} />} />
        </AccordionWithState>
      )}
      <Form onSubmit={handleSubmit(onNext)}>
        <AutoGrid>
          <ControlledSelect
            name="reason"
            control={control}
            label={t("reservations:cancel.reason")}
            options={reasons}
            required
            disabled={isDisabled}
          />
          <Actions>
            <ButtonLikeLink
              data-testid="reservation-cancel__button--back"
              href={backLink}
              size="large"
            >
              <IconCross aria-hidden="true" />
              {t("reservations:cancelButton")}
            </ButtonLikeLink>
            <Button
              variant="primary"
              type="submit"
              disabled={isDisabled || !watch("reason")}
              data-testid="reservation-cancel__button--cancel"
              isLoading={isLoading}
            >
              {t("reservations:cancel.reservation")}
            </Button>
          </Actions>
        </AutoGrid>
      </Form>
    </FormWrapper>
  );
}
