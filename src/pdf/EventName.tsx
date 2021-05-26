import { StyleSheet, Text, View } from '@react-pdf/renderer';
import React from 'react';
import { ApplicationEvent } from '../common/types';
import { H1 } from './Typography';

const styles = StyleSheet.create({
  eventName: {
    position: 'absolute',
    bottom: 0,
    display: 'flex',
    flexDirection: 'row',
    marginHorizontal: '38pt',
    marginVertical: '41pt',
  },
});

const EventName = (applicationEvent: ApplicationEvent): JSX.Element => (
  <View style={styles.eventName}>
    <Text>Vakiovuoron nimi</Text>
    <H1>{applicationEvent.name}</H1>
  </View>
);

export default EventName;
