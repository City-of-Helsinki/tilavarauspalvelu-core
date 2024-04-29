import styled, { css } from "styled-components";
import { breakpoints } from "common/src/common/style";

export const ContentContainer = styled.div`
  padding: var(--spacing-m);
`;

ContentContainer.displayName = "ContentContainer";

export const IngressContainer = styled.div`
  padding: 0 var(--spacing-m) 0 var(--spacing-m);

  @media (min-width: ${breakpoints.m}) {
    padding: 0 var(--spacing-m) 0 var(--spacing-4-xl);
  }

  @media (min-width: ${breakpoints.xl}) {
    padding-right: 8.333%;
  }
`;
IngressContainer.displayName = "IngressContainer";

export const DenseVerticalFlex = styled.div`
  display: flex;
  gap: var(--spacing-xs);
  flex-direction: column;
`;

DenseVerticalFlex.displayName = "DenseVerticalFlex";

export const VerticalFlex = styled.div`
  display: flex;
  gap: var(--spacing-m);
  flex-direction: column;
`;

VerticalFlex.displayName = "VerticalFlex";

export const HorisontalFlex = styled.div`
  display: flex;
  gap: var(--spacing-m);
  flex-direction: row;
`;

HorisontalFlex.displayName = "HorisontalFlex";

export const ButtonContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-2-xs);
  width: 100%;
  margin-bottom: var(--spacing-s);
`;
ButtonContainer.displayName = "ButtonContainer";

// grid because flex causes overflow problems in children
export const Container = styled.div`
  display: grid;
  gap: var(--spacing-layout-2-xs);

  max-width: var(--container-width-xl);

  margin: var(--spacing-layout-2-xs) var(--spacing-layout-m);

  @media (max-width: ${breakpoints.m}) {
    margin: var(--spacing-layout-2-xs);
  }
`;
Container.displayName = "Container";

export const ContainerMedium = styled.div`
  display: grid;
  gap: var(--spacing-layout-2-xs);
  max-width: var(--container-width-l);
  margin: var(--spacing-layout-2-xs);

  @media (width > ${breakpoints.m}) {
    margin: var(--spacing-layout-2-xs) var(--spacing-layout-m);
  }
`;

export const autoGridCss = css`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(14rem, 1fr));
  align-items: baseline;
  gap: var(--spacing-m);
`;

export const AutoGrid = styled.div<{ $minWidth?: string }>`
  display: grid;
  grid-template-columns: repeat(
    auto-fill,
    minmax(
      ${({ $minWidth }) =>
        $minWidth && $minWidth?.length > 0 ? $minWidth : "16rem"},
      1fr
    )
  );
  align-items: baseline;
  gap: var(--spacing-m);
`;
AutoGrid.displayName = "AutoGrid";

export const FullRow = styled.div`
  grid-column: 1 / -1;
`;

export const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  align-items: baseline;
  gap: var(--spacing-m);
  margin: 0;
  padding: 0;
`;

Grid.displayName = "Grid";

export const Span3 = styled.div`
  grid-column: span 12;
  @media (min-width: ${breakpoints.l}) {
    grid-column: span 3;
  }
  @media (min-width: ${breakpoints.xl}) {
    grid-column: span 3;
  }
`;

export const Span6 = styled.div`
  grid-column: span 12;

  @media (min-width: ${breakpoints.l}) {
    grid-column: span 6;
  }
`;

export const Span12 = styled.div`
  grid-column: span 12;
`;

// Tab causes horizontal overflow without this
// we use grids primarily and components inside grid without max-width overflow.
// Because of side navigation we have to some silly calculations here.
export const TabWrapper = styled.div`
  max-width: 95vw;
  @media (width > ${breakpoints.m}) {
    max-width: min(
      calc(95vw - var(--main-menu-width) - 2 * var(--spacing-layout-m)),
      var(--container-width-xl)
    );
  }
`;
