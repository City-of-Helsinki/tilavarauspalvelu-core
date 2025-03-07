import React from "react";
import { useTranslation } from "next-i18next";
import { signIn } from "common/src/browserHelpers";
import { useSession } from "@/hooks/auth";
import { Button, ButtonSize } from "hds-react";

type Props = {
  apiBaseUrl: string;
  componentIfAuthenticated: JSX.Element;
  isActionDisabled?: boolean;
  returnUrl?: string;
  type: "application" | "reservation";
};

export function LoginFragment({
  apiBaseUrl,
  componentIfAuthenticated,
  isActionDisabled,
  returnUrl,
  type,
}: Props): JSX.Element {
  // TODO pass the isAuthenticated from SSR and remove the hook
  const { isAuthenticated } = useSession();
  const { t } = useTranslation();

  const handleClick = () => {
    signIn(apiBaseUrl, returnUrl);
  };

  if (isAuthenticated) {
    return componentIfAuthenticated;
  }

  return (
    <Button
      onClick={handleClick}
      className="login-fragment__button--login"
      disabled={isActionDisabled}
      size={type === "application" ? ButtonSize.Small : ButtonSize.Medium}
    >
      {type === "application"
        ? t("shoppingCart:loginAndApply")
        : t("shoppingCart:loginAndReserve")}
    </Button>
  );
}
