import React, { SVGProps } from "react";

// generated with SVGR from svg but the viewBox needs to be added manually
// Use this instead of the svg in common components since NextJS doesn't include SVGR
const SvgComponent = (props: SVGProps<SVGSVGElement>) => (
  <svg
    width={18}
    height={17}
    viewBox="0 0 18 17"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <g transform="translate(1 1)" fill="none" fillRule="evenodd">
      <path
        stroke="currentColor"
        strokeWidth={1.5}
        d="M7.718 0 0 4.41v9.922h15.435V4.41zM4.41 7.718v6.614"
      />
      <circle fill="currentColor" cx={7.718} cy={4.961} r={1.103} />
      <path
        stroke="currentColor"
        strokeWidth={1.5}
        d="M7.718 7.718v6.614M11.025 7.718v6.614"
      />
    </g>
  </svg>
);

export default SvgComponent;
