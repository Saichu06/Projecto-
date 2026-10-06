import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const priorityMap = {
  HIGH: {
    label: 'High',
    bg: '#FEE2E2',
    text: '#B91C1C',
  },
  MEDIUM: {
    label: 'Medium',
    bg: '#FEF3C7',
    text: '#B45309',
  },
  LOW: {
    label: 'Low',
    bg: '#F1F5F9',
    text: '#64748B',
  },
};

export const PriorityBadge = ({ priority }) => {
  const item = priorityMap[priority] || priorityMap.MEDIUM;

  return (
    <View style={[styles.badge, { backgroundColor: item.bg }]}>
      <Text style={[styles.text, { color: item.text }]}>{item.label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 11,
    fontWeight: '600',
  },
});
