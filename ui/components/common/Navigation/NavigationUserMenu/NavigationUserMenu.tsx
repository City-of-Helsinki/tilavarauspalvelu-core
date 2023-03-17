import React from "react";
import { IconSignout, Navigation as HDSNavigation } from "hds-react";
import { signIn, useSession } from "next-auth/react";
import { useTranslation } from "next-i18next";
import { useRouter } from "next/router";
import styled, { css } from "styled-components";
import { NavigationUserMenuUserCard } from "./NavigationUserMenuUserCard";
import { authenticationIssuer } from "../../../../modules/const";
import { MenuItem } from "../types";
import { useLogout } from "../../../../hooks/useLogout";

const StyledUserMenu = styled(HDSNavigation.User)<{
  $active?: boolean;
}>`
  ${({ $active }) =>
    $active &&
    css`
      &:after {
        content: "";
        position: absolute;
        bottom: -20px;
        width: 100%;
        border-bottom: 3px solid var(--color-bus);
        z-index: -1;
      }
    `}
`;

const NavigationUserMenuItem = styled(HDSNavigation.Item)<{
  $divider?: boolean;
  icon?: JSX.Element;
}>`
  &:last-of-type {
    padding-bottom: 0;
  }

  cursor: pointer;
  display: flex;
  padding-block: ${(props) => props.theme.spacing.xs};
  color: ${(props) => props.theme.colors.black.dark};
  text-decoration: none;

  @media (min-width: ${(props) => props.theme.breakpoints.m}) {
    &:last-of-type {
      padding-bottom: ${(props) => props.theme.spacing.xs};
    }
    padding-left: ${(props) => props.theme.spacing.s};
  }

  & > span {
    margin: 0 !important;
  }

  & > svg {
    margin-left: ${(props) => props.theme.spacing.xs};
  }

  ${({ $divider }) =>
    $divider &&
    css`
      position: relative;
      margin-top: var(--spacing-m) !important;

      &:after {
        content: "";
        border-top-style: solid;
        border-top-width: 1px;
        border-top-color: ${(props) => props.theme.colors.black.light};
        position: absolute;
        width: 100%;
        top: calc(var(--spacing-xs) * -1);

        @media (min-width: ${(props) => props.theme.breakpoints.m}) {
          width: 80%;
        }
      }
    `}

  ${({ icon }) =>
    icon &&
    css`
      & > span:first-of-type {
        order: 2;
        padding-left: var(--spacing-xs);
      }
    `}
`;

const userMenuItems: MenuItem[] = [
  {
    title: "reservations",
    path: "/reservations",
  },
  {
    title: "applications",
    path: "/applications",
  },
];

const NavigationUserMenu = () => {
  const router = useRouter();
  const session = useSession();
  const { t } = useTranslation();
  const { logout } = useLogout();

  const user = session.data?.user;
  const isActive = userMenuItems
    .map((item) => item.path)
    .includes(router.pathname);

  const handleSignIn = () => {
    signIn(authenticationIssuer, {
      callbackUrl: window.location.href,
    });
  };

  const handleSignOut = () => {
    logout();
  };

  return (
    <StyledUserMenu
      userName={user?.name ?? ""}
      authenticated={session.status === "authenticated"}
      label={t("common:login")}
      onSignIn={handleSignIn}
      closeOnItemClick
      $active={isActive}
    >
      {user ? (
        <>
          <NavigationUserMenuUserCard user={user} />
          {userMenuItems.map((item) => (
            <NavigationUserMenuItem
              href="#"
              key={item.path}
              onClick={() =>
                router.push(item.path, item.path, { locale: router.locale })
              }
            >
              {t(`navigation:Item.${item.title}`)}
            </NavigationUserMenuItem>
          ))}
        </>
      ) : null}
      <NavigationUserMenuItem
        href="#"
        onClick={handleSignOut}
        icon={<IconSignout aria-hidden />}
        label={t("common:logout")}
        $divider={!!user}
      />
    </StyledUserMenu>
  );
};

export { NavigationUserMenu };
