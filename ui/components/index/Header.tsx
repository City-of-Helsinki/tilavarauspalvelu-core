import React, { useState } from "react";
import { IconSearch, TextInput } from "hds-react";
import router from "next/router";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import { breakpoint } from "../../modules/style";

interface HeadProps {
  heading: string;
  text: string;
}

const Wrapper = styled.div`
  width: 100%;

  @media (min-width: ${breakpoint.m}) {
    background-image: url("images/hero-front@1x.jpg");
    background-size: cover;

    @media (-webkit-min-device-pixel-ratio: 2) {
      background-image: url("images/hero-front@2x.jpg");
    }
  }
`;

const Content = styled.div`
  font-size: var(--fontsize-body-xl);
  background-color: var(--tilavaraus-header-background-color);
  padding: var(--spacing-m) 0 var(--spacing-xl);

  @media (min-width: ${breakpoint.m}) {
    background-color: transparent;
    display: flex;
    max-width: var(--container-width-xl);
    padding: var(--spacing-layout-xl) var(--spacing-m) var(--spacing-3-xl);
    justify-content: center;
    margin: 0 auto;
    padding-bottom: var(--spacing-layout-2-xl);
  }
`;

const Box = styled.div`
  padding: var(--spacing-m) var(--spacing-s) 0;
  font-family: var(--font-regular);

  @media (min-width: ${breakpoint.m}) {
    text-align: center;
    background-color: rgba(0, 0, 0, 0.75);
    max-width: 742px;
    color: var(--color-white);
    padding: var(--spacing-l) var(--spacing-3-xl) var(--spacing-3-xl);
  }
`;

const StyledTextInput = styled(TextInput)`
  && {
    input {
      border-color: var(--color-black-90);
      font-size: var(--fontsize-heading-xs);
      padding: 0 var(--spacing-layout-m) 0 var(--spacing-s);

      @media (min-width: ${breakpoint.m}) {
        height: 80px;
        font-size: var(--fontsize-heading-m);
        padding: 0 var(--spacing-layout-xl) 0 var(--spacing-l);
      }
    }
  }

  margin-top: var(--spacing-xl);

  label {
    svg {
      --icon-size: var(--spacing-m) !important;
      cursor: pointer;
    }

    position: absolute;
    right: var(--spacing-s);
    top: 28%;
    z-index: 1;
  }

  @media (min-width: ${breakpoint.m}) {
    padding: var(--spacing-m);

    label {
      svg {
        --icon-size: var(--spacing-l) !important;
      }

      right: var(--spacing-3-xl);
      top: 37%;
    }
  }
`;

const H1 = styled.h1`
  font-size: var(--fontsize-heading-l);
  margin-top: 0;
  margin-bottom: 0;

  @media (min-width: ${breakpoint.m}) {
    font-size: var(--fontsize-heading-xl);
  }
`;

const SubmitIcon = styled(IconSearch)<{ $active: boolean }>`
  cursor: ${({ $active }) => ($active ? "pointer" : "default")};
`;

const Head = (props: HeadProps): JSX.Element => {
  const [searchTerm, setSearchTerm] = useState<string>("");

  const { t } = useTranslation("home");

  const handleSubmit = (event: React.FormEvent | React.MouseEvent) => {
    event.preventDefault();
    router.push(`/search?search=${searchTerm}`);
  };

  return (
    <Wrapper>
      <Content>
        <Box>
          <H1>{props.heading}</H1>
          <p>{props.text}</p>
          <form onSubmit={(e) => handleSubmit(e)}>
            <StyledTextInput
              id="searchInput--frontpage"
              placeholder={t("head.searchPlaceholder")}
              onChange={(e) => setSearchTerm(e.target.value)}
              label={
                <SubmitIcon
                  size="m"
                  onClick={(e) => handleSubmit(e)}
                  $active={!!searchTerm}
                />
              }
            />
          </form>
        </Box>
      </Content>
    </Wrapper>
  );
};

export default Head;
