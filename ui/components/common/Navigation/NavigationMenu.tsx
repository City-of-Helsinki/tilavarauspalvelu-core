import React from "react";
import { Navigation as HDSNavigation } from "hds-react";
import { useTranslation } from "next-i18next";
import { useRouter } from "next/router";
import styled from "styled-components";
import { NavigationMenuItem } from "./NavigationMenuItem";

const StyledNavigationMenu = styled(HDSNavigation.Row)`
  align-items: center !important;
  justify-items: center !important;
  color: red !important;
`;

type MenuItem = {
  title: string;
  path: string;
  condition?: boolean;
};

type Props = {
  menuItems: MenuItem[];
};

const NavigationMenu = ({ menuItems }: Props) => {
  const { t } = useTranslation(["navigation"]);
  const router = useRouter();

  return (
    <StyledNavigationMenu variant="inline">
      {menuItems.map((item) => (
        <NavigationMenuItem
          key={item.title}
          href="#"
          onClick={() =>
            router.push(item.path, item.path, { locale: router.locale })
          }
          className={router.pathname === item.path ? "active" : ""}
        >
          {t(`navigation:Item.${item.title}`)}
        </NavigationMenuItem>
      ))}
    </StyledNavigationMenu>
  );
};

export { NavigationMenu };
export type { MenuItem };
