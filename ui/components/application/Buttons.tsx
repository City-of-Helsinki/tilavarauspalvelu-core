import React from "react";
import { useTranslation } from "next-i18next";
import { IconArrowRight } from "hds-react";
import { useRouter } from "next/router";
import { ButtonContainer } from "../common/common";
import { MediumButton } from "../../styles/util";

type Props = {
  onSubmit: () => void;
  applicationId: number;
};

const Buttons = ({ onSubmit, applicationId }: Props): JSX.Element | null => {
  const { t } = useTranslation();

  const router = useRouter();
  return (
    <ButtonContainer>
      <MediumButton
        variant="secondary"
        onClick={() => router.push(`${applicationId}/page2`)}
      >
        {t("common:prev")}
      </MediumButton>
      <MediumButton id="next" iconRight={<IconArrowRight />} onClick={onSubmit}>
        {t("common:next")}
      </MediumButton>
    </ButtonContainer>
  );
};

export default Buttons;
