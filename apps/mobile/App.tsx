import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { PropertyType } from '@orvyn/shared-types';
import { formatCurrency } from '@orvyn/utils';

export default function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Orvyn PMS Mobile</Text>
      <Text style={styles.subtitle}>Tenant & Owner Mobile Application</Text>
      <View style={styles.box}>
        <Text style={styles.boxText}>Shared Type: {PropertyType.VILLA}</Text>
        <Text style={styles.boxText}>Sample Amount: {formatCurrency(1800, 'USD')}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
  },
  box: {
    padding: 16,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    width: '100%',
  },
  boxText: {
    fontSize: 14,
    color: '#1f2937',
    marginVertical: 4,
  },
});
