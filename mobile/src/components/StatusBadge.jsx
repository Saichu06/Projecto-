import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';

const statusMap = {
  NOT_STARTED: {
    label: 'Not Started',
    bg: '#F1F5F9',
    text: '#475569',
    dot: '#94A3B8',
  },
  PENDING: {
    label: 'Pending',
    bg: '#FEF3C7',
    text: '#92400E',
    dot: '#D97706',
  },
  IN_PROGRESS: {
    label: 'In Progress',
    bg: '#EFF6FF',
    text: '#1D4ED8',
    dot: '#2563EB',
  },
  COMPLETED: {
    label: 'Completed',
    bg: '#DCFCE7',
    text: '#166534',
    dot: '#16A34A',
  },
};

export const StatusBadge = ({ status }) => {
  const item = statusMap[status] || statusMap.NOT_STARTED;

  return (
    <View style={[styles.badge, { backgroundColor: item.bg }]}>
      <View style={[styles.dot, { backgroundColor: item.dot }]} />
      <Text style={[styles.text, { color: item.text }]}>{item.label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },
  text: {
    fontSize: 11,
    fontWeight: '600',
  },
});
