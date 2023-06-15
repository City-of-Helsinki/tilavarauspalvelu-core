import styled from "styled-components";
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

export const NarrowContainer = styled.div`
  padding: 0 var(--spacing-m) 0 var(--spacing-m);

  @media (min-width: ${breakpoints.m}) {
    padding: 0 var(--spacing-2-xl) 0 var(--spacing-4-xl);
  }

  @media (min-width: ${breakpoints.xl}) {
    padding: 0 16.666% 0 calc(var(--spacing-3-xl) * 1.85);
  }
`;

NarrowContainer.displayName = "NarrowContainer";

export const WideContainer = styled(IngressContainer)`
  padding-left: var(--spacing-m);
`;

WideContainer.displayName = "WideContainer";

export const GridCol = styled.div`
  &:last-child {
    padding-bottom: var(--spacing-xl);
  }

  font-size: var(--fontsize-heading-xs);
  line-height: 1.75;

  table {
    width: 100%;
  }

  th {
    text-align: left;
    padding: 0 0 var(--spacing-xs) 0;
    white-space: nowrap;
  }

  td {
    padding: 0 0 var(--spacing-xs) 0;
    width: 17%;
    white-space: nowrap;
  }

  p {
    font-size: var(--fontsize-body-s);
    padding-right: 20%;
  }

  @media (min-width: ${breakpoints.l}) {
    padding-right: 20%;

    h3 {
      margin-top: 0;
    }

    p {
      padding: 0;
    }
  }
`;

export const DataGrid = styled.div`
  display: grid;
  border-top: 1px solid var(--color-silver);
  padding-top: var(--spacing-xl);
  margin-bottom: var(--spacing-layout-xl);

  th {
    padding-right: var(--spacing-l);
  }

  &:last-of-type {
    margin-bottom: var(--spacing-layout-s);
  }

  @media (min-width: ${breakpoints.l}) {
    grid-template-columns: 1fr 1fr;
    border-bottom: 0;
  }
`;

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

export const SparseVerticalFlex = styled.div`
  display: flex;
  gap: var(--spacing-l);
  flex-direction: column;
`;

SparseVerticalFlex.displayName = "SparseVerticalFlex";

export const VerticalFlexNoGap = styled.div`
  display: flex;
  gap: 0;
  flex-direction: column;
`;

VerticalFlexNoGap.displayName = "VerticalFlexNoGap";

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

export const Content = styled.div`
  padding: 0 var(--spacing-2-xl);
`;

Content.displayName = "Content";

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

export const Span4 = styled.div`
  grid-column: span 12;
  @media (min-width: ${breakpoints.m}) {
    grid-column: span 6;
  }
  @media (min-width: ${breakpoints.l}) {
    grid-column: span 4;
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
