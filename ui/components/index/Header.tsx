import React, { useState } from "react";
import { IconSearch, TextInput } from "hds-react";
import router from "next/router";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import { breakpoint } from "../../modules/style";
import { searchPrefix } from "../../modules/const";
import Container from "../common/Container";
import { fontRegular, H1 } from "../../modules/style/typography";

interface HeadProps {
  heading: string;
  text: string;
}

const Wrapper = styled.div`
  width: 100%;
  background-color: var(--tilavaraus-hero-background-color);
  color: var(--color-white);
  font-size: var(--fontsize-heading-s);
`;

const Content = styled(Container)`
  display: grid;
  padding: var(--spacing-layout-l) var(--spacing-m) var(--spacing-layout-m);

  @media (min-width: ${breakpoint.m}) {
    padding: var(--spacing-layout-xl) var(--spacing-m) var(--spacing-layout-xl);
    grid-template-columns: 1fr 1fr;
    gap: var(--spacing-3-xl);
    min-height: 380px;
  }
`;

const Image = styled.div`
  display: none;

  @media (min-width: ${breakpoint.m}) {
    display: block;
    background-image: url("/images/hero-front@1x.jpg");
    background-size: cover;
    max-width: 100%;
    height: 100%;

    @media (-webkit-min-device-pixel-ratio: 2) {
      background-image: url("images/hero-front@2x.jpg");
    }
  }
`;

const Left = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
`;

const StyledTextInput = styled(TextInput)`
  && {
    input {
      border-color: var(--color-black-90);
      font-size: var(--fontsize-heading-xs);
      padding: 0 var(--spacing-layout-m) 0 var(--spacing-s);
      --placeholder-color: var(--tilavaraus-content-text-color);

      @media (min-width: ${breakpoint.m}) {
        height: 80px;
        font-size: var(--fontsize-heading-m);
        padding: 0 var(--spacing-layout-xl) 0 var(--spacing-l);
      }
    }
  }

  margin-top: var(--spacing-m);
  max-width: 480px;

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
    max-width: unset;

    label {
      svg {
        --icon-size: var(--spacing-l) !important;
      }

      right: var(--spacing-l);
      top: 32%;
    }
  }
`;

const Title = styled(H1)`
  ${fontRegular}
  font-size: var(--fontsize-heading-xl);
  margin-top: 0;
  margin-bottom: 0;

  @media (min-width: ${breakpoint.m}) {
    font-size: 4rem;
  }
`;

const SubmitIcon = styled(IconSearch)<{ $active: boolean }>`
  cursor: ${({ $active }) => ($active ? "pointer" : "default")};
`;

const Head = (props: HeadProps): JSX.Element => {
  const [searchTerm, setSearchTerm] = useState<string>("");

  const { t } = useTranslation(["home", "common"]);

  const handleSubmit = (event: React.FormEvent | React.MouseEvent) => {
    event.preventDefault();
    router.push(`${searchPrefix}?textSearch=${searchTerm}`);
  };

  return (
    <Wrapper>
      <Content>
        <Left>
          <div>
            <Title>{props.heading}</Title>
            <p>{props.text}</p>
          </div>
          <form onSubmit={(e) => handleSubmit(e)}>
            <StyledTextInput
              id="searchInput--frontpage"
              placeholder={t("head.searchPlaceholder")}
              onChange={(e) => setSearchTerm(e.target.value)}
              label={
                <SubmitIcon
                  size="m"
                  onClick={(e) => handleSubmit(e)}
                  aria-label={t("common:search")}
                  $active={!!searchTerm}
                />
              }
            />
          </form>
        </Left>
        <Image />
      </Content>
    </Wrapper>
  );
};

export default Head;
