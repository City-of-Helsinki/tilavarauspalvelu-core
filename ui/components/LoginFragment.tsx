import React from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { UserProfile } from "common/types/common";
import { breakpoints } from "common/src/common/style";
import { authEnabled, isBrowser } from "../modules/const";
import RequireAuthentication from "./common/RequireAuthentication";
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
  type InnerProps = {
    profile: UserProfile | null;
  };

  const { t } = useTranslation();

  const [shouldLogin, setShouldLogin] = React.useState(false);

  if (shouldLogin) {
    return (
      <RequireAuthentication>
        <div />
      </RequireAuthentication>
    );
  }

  if (!isBrowser) {
    return null;
  }

  const WithOidc = require("./common/WithOidc").default;

  return (
    <WithOidc
      render={({ profile }: InnerProps) => {
        return !profile && authEnabled ? (
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
          <>{componentIfAuthenticated}</>
        );
      }}
    />
  );
};

export default LoginFragment;
