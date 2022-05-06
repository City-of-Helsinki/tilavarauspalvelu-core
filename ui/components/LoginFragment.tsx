import React from "react";
import { IconSignin } from "hds-react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { breakpoint } from "../modules/style";
import { authEnabled, isBrowser } from "../modules/const";
import { UserProfile } from "../modules/types";
import RequireAuthentication from "./common/RequireAuthentication";
import { MediumButton } from "../styles/util";

type Props = {
  text?: string;
  componentIfAuthenticated?: React.ReactNode;
};

const Wrapper = styled.div`
  display: flex;
  margin-bottom: var(--spacing-xl);
  align-items: center;
  text-align: center;
  flex-direction: column;
  gap: var(--spacing-xs);

  button {
    width: 100%;
  }

  @media (min-width: ${breakpoint.s}) {
    flex-direction: row;
    justify-content: flex-start;
    text-align: left;
    gap: var(--spacing-m);

    button {
      width: auto;
    }
  }
`;

const LoginFragment = ({
  text,
  componentIfAuthenticated,
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
            <MediumButton
              iconLeft={<IconSignin aria-hidden="true" />}
              onClick={() => setShouldLogin(true)}
              aria-label={t("common:loginAlt")}
            >
              {t("common:loginAlt")}
            </MediumButton>
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
