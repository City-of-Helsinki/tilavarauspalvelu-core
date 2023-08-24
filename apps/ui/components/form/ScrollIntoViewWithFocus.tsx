import React from "react";

interface Props {
  children: React.ReactNode;
  className?: string;
  isFocused: boolean;
}

const ScrollIntoViewWithFocus: React.FC<Props> = ({
  children,
  className,
  isFocused,
}) => {
  const selfRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (isFocused && selfRef.current?.scrollIntoView) {
      selfRef.current?.scrollIntoView({ block: "nearest", inline: "nearest" });
    }
  }, [isFocused]);

  return (
    <div ref={selfRef} className={className}>
      {children}
    </div>
  );
};

export default ScrollIntoViewWithFocus;
