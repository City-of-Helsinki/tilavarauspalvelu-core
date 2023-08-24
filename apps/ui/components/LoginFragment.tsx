import React from "react";
import { useTranslation } from "next-i18next";
import styled from "styled-components";
import { breakpoints } from "common/src/common/style";
import { signIn, useSession } from "next-auth/react";
import { authEnabled, authenticationIssuer, isBrowser } from "../modules/const";
import { MediumButton } from "../styles/util";

type Props = {
  text?: string;
  componentIfAuthenticated?: React.ReactNode;
  isActionDisabled?: boolean;
  actionCallback?: () => void;
};

const Wrapper = styled.div`
  display: flex;
  align-items: center;
  text-align: center;
  flex-direction: column;
  gap: var(--spacing-xs);

  button {
    width: 100%;
  }

  @media (min-width: ${breakpoints.s}) {
    flex-direction: row;
    justify-content: flex-start;
    text-align: left;
    gap: var(--spacing-m);

    button {
      width: auto;
    }
  }
`;

const SubmitButton = styled(MediumButton)`
  white-space: nowrap;

  > span {
    margin: 0 !important;
    padding-right: var(--spacing-3-xs);
    padding-left: var(--spacing-3-xs);
  }
`;

const LoginFragment = ({
  text,
  componentIfAuthenticated,
  isActionDisabled,
  actionCallback,
}: Props): JSX.Element => {
  const session = useSession();
  const { t } = useTranslation();

  const isAuthenticated = session?.status === "authenticated";

  const [shouldLogin, setShouldLogin] = React.useState(false);

  if (!isBrowser) {
    return null;
  }

  if (shouldLogin) {
    signIn(authenticationIssuer, {
      callbackUrl: window.location.href,
    });
  }

  return !isAuthenticated && authEnabled ? (
    <Wrapper>
      <SubmitButton
        onClick={() => {
          if (actionCallback) {
            actionCallback();
          }
          setShouldLogin(true);
        }}
        aria-label={t("reservationCalendar:loginAndReserve")}
        className="login-fragment__button--login"
        disabled={isActionDisabled}
      >
        {t("reservationCalendar:loginAndReserve")}
      </SubmitButton>
      {text}
    </Wrapper>
  ) : (
    <Wrapper>{componentIfAuthenticated}</Wrapper>
  );
};

export default LoginFragment;
