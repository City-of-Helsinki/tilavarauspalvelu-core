import React from 'react';

type IconWithTextProps = {
  icon: React.ReactElement;
  text?: string;
  texts?: string[][];
};

const IconWithText = ({
  icon,
  text = '',
  texts = [],
}: IconWithTextProps): JSX.Element => (
  <>
    {text && (
      <div className="align-vertically">
        {icon}
        <span className="margin-left-s">{text}</span>
      </div>
    )}
    {texts.length > 0 && (
      <div
        style={{
          display: 'grid',
          gridAutoRows: '1fr',
          alignItems: 'center',
          gridTemplateColumns: 'var(--spacing-xl) 1fr 4fr',
        }}>
        {texts.map(([day, time], index) => {
          return (
            <>
              {index === 0 ? icon : <div />}
              <div>{day}</div>
              <div>{time}</div>
            </>
          );
        })}
      </div>
    )}
  </>
);

export default IconWithText;
