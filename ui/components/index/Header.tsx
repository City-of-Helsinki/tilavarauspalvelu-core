import React, { useState } from "react";
import { IconSearch, TextInput } from "hds-react";
import router from "next/router";
import Image from "next/image";
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
    gap: var(--spacing-xl);
    grid-template-columns: 1fr 1fr;
    min-height: 380px;
  }

  @media (min-width: ${breakpoint.l}) {
    gap: var(--spacing-layout-2-xl);
    grid-template-columns: 1fr 1fr;
  }

  @media (min-width: 1050px) {
    grid-template-columns: 1fr 572px;
  }
`;

const ImageWrapper = styled.div`
  display: none;
  position: relative;

  @media (min-width: ${breakpoint.m}) {
    display: block;
    max-width: 100%;
    height: 100%;
    max-height: 377px;
  }
`;

const Left = styled.div`
  display: flex;
  flex-direction: column;
`;

const StyledTextInput = styled(TextInput)`
  && {
    input {
      border-color: var(--color-black-90);
      font-size: var(--fontsize-body-m);
      padding: 0 var(--spacing-layout-m) 0 var(--spacing-s);
      --placeholder-color: var(--color-black-60);

      @media (min-width: ${breakpoint.m}) {
        font-size: var(--fontsize-body-m);
        padding: 0 var(--spacing-2-xl) 0 var(--spacing-s);
      }
    }
  }

  margin-top: var(--spacing-l);
  max-width: 480px;

  label {
    svg {
      --icon-size: var(--spacing-m) !important;
      cursor: pointer;
    }

    position: absolute;
    right: var(--spacing-s);
    top: 30%;
    z-index: 1;
  }

  @media (min-width: ${breakpoint.m}) {
    max-width: 245px;
  }
`;

const Title = styled(H1)`
  ${fontRegular}
  margin-bottom: 0;

  @media (min-width: ${breakpoint.m}) {
    margin-top: var(--spacing-l);
  }
`;

const Ingress = styled.p`
  margin: var(--spacing-l) 0;
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
            <Ingress>{props.text}</Ingress>
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
        <ImageWrapper>
          <Image
            alt=""
            src="/images/hero-front.png"
            layout="fill"
            objectFit="cover"
            quality={90}
          />
        </ImageWrapper>
      </Content>
    </Wrapper>
  );
};

export default Head;
