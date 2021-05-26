import { Image } from '@react-pdf/renderer';
import React from 'react';
import HelsinkiLogo from './logo.png';

const Logo = (): JSX.Element => (
  <Image style={{ width: 82 }} src={HelsinkiLogo} />
);
export default Logo;
