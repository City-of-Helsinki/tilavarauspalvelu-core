import React, { useState } from "react";
import { Checkbox } from "hds-react";
import { useTranslation } from "next-i18next";
import Link from "next/link";
import { useRouter } from "next/router";
import { Application } from "common/types/common";
import { TermsOfUseType } from "common/types/gql-types";
import { deepCopy, getTranslation } from "@/modules/util";
import { useOptions } from "@/hooks/useOptions";
import { MediumButton } from "@/styles/util";
import ApplicantInfoPreview from "./ApplicantInfoPreview";
import { CheckboxContainer, StyledNotification, Terms } from "./styled";
import { ButtonContainer, FormSubHeading } from "../common/common";
import { AccordionWithState as Accordion } from "../common/Accordion";
import ApplicationEventList from "./ApplicationEventList";

type Props = {
  application: Application;
  onNext: (application: Application) => void;
  tos: TermsOfUseType[];
};

const prepareData = (data: Application): Application => {
  const applicationCopy = deepCopy(data);
  applicationCopy.status = "in_review";
  return applicationCopy;
};

const Preview = ({ onNext, application, tos }: Props): JSX.Element | null => {
  const [acceptTermsOfUse, setAcceptTermsOfUse] = useState(false);
  const router = useRouter();

  const { options } = useOptions();
  const citiesOptions = options.cityOptions;

  const { t } = useTranslation();

  const onSubmit = (data: Application): void => {
    const appToSave = prepareData(data);
    onNext(appToSave);
  };

  // application not saved yet
  if (!application.id) {
    return (
      <>
        <h1>{t("application:preview.noData.heading")}</h1>
        <Link href="page1">
          <a>{t("application:preview.noData.text")}</a>
        </Link>
      </>
    );
  }

  const tos1 = tos.find((n) => n.pk === "generic1");
  const tos2 = tos.find((n) => n.pk === "KUVAnupa");

  return (
    <>
      <Accordion
        open
        id="basicInfo"
        heading={t("application:preview.basicInfoSubHeading")}
        theme="thin"
      >
        <ApplicantInfoPreview
          cities={citiesOptions}
          application={application}
        />
      </Accordion>
      <ApplicationEventList events={application.applicationEvents} />
      <FormSubHeading>{t("reservationUnit:termsOfUse")}</FormSubHeading>
      {tos1 && <Terms tabIndex={0}>{getTranslation(tos1, "text")}</Terms>}
      <FormSubHeading>
        {t("application:preview.reservationUnitTerms")}
      </FormSubHeading>
      {tos2 && <Terms tabIndex={0}>{getTranslation(tos2, "text")}</Terms>}
      <CheckboxContainer>
        <Checkbox
          id="preview.acceptTermsOfUse"
          checked={acceptTermsOfUse}
          onChange={(e) => setAcceptTermsOfUse(e.target.checked)}
          label={t("application:preview.userAcceptsTerms")}
        />
      </CheckboxContainer>
      <StyledNotification
        label={t("application:preview.notification.processing")}
      >
        {t("application:preview.notification.body")}
      </StyledNotification>
      <ButtonContainer>
        <MediumButton
          variant="secondary"
          onClick={() => router.push(`${application.id}/page3`)}
        >
          {t("common:prev")}
        </MediumButton>
        <MediumButton
          id="submit"
          onClick={() => {
            onSubmit(application);
          }}
          disabled={!acceptTermsOfUse}
        >
          {t("common:submit")}
        </MediumButton>
      </ButtonContainer>
    </>
  );
};

export default Preview;
