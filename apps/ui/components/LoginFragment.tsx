import React from "react";
import { useTranslation } from "next-i18next";
import { signIn } from "common/src/browserHelpers";
import { useSession } from "@/hooks/auth";
import { SubmitButton } from "@/styles/util";

type Props = {
  apiBaseUrl: string;
  text?: string;
  componentIfAuthenticated?: React.ReactNode;
  isActionDisabled?: boolean;
  actionCallback?: () => void;
  returnUrl?: string;
};

function LoginFragment({
  apiBaseUrl,
  text,
  componentIfAuthenticated,
  isActionDisabled,
  actionCallback,
  returnUrl,
}: Props): JSX.Element | null {
  // TODO pass the isAuthenticated from SSR and remove the hook
  const { isAuthenticated } = useSession();
  const { t } = useTranslation();

  return !isAuthenticated ? (
    <div>
      <SubmitButton
        onClick={() => {
          if (actionCallback) {
            actionCallback();
          }
          if (returnUrl) {
            signIn(apiBaseUrl, returnUrl);
            return;
          }
          signIn(apiBaseUrl);
        }}
        aria-label={t("reservationCalendar:loginAndReserve")}
        className="login-fragment__button--login"
        disabled={isActionDisabled}
      >
        {t("reservationCalendar:loginAndReserve")}
      </SubmitButton>
      {text}
    </div>
  ) : (
    <div>{componentIfAuthenticated}</div>
  );
}

export default LoginFragment;
