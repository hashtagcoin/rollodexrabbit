import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, TrendingUp, Calendar, DollarSign, Users, ChartBar as BarChart3, ChartPie as PieChart } from 'lucide-react-native';

function BarGraph({ data }: { data: { label: string; value: number }[] }) {
  const max = Math.max(...data.map(item => item.value));
  
  return (
    <View style={barStyles.container}>
      {data.map((item, index) => (
        <View key={index} style={barStyles.barGroup}>
          <View style={barStyles.barContainer}>
            <View 
              style={[
                barStyles.bar, 
                { height: `${(item.value / max) * 100}%` }
              ]}
            />
          </View>
          <Text style={barStyles.barLabel}>{item.label}</Text>
        </View>
      ))}
    </View>
  );
}

const barStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 200,
    marginTop: 20,
  },
  barGroup: {
    flex: 1,
    alignItems: 'center',
  },
  barContainer: {
    width: 30,
    height: '100%',
    justifyContent: 'flex-end',
  },
  bar: {
    width: '100%',
    backgroundColor: '#007AFF',
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  barLabel: {
    marginTop: 8,
    fontSize: 12,
    color: '#666',
  },
});

export default function AnalyticsScreen() {
  // Mock data for the analytics
  const bookingData = [
    { label: 'Mon', value: 3 },
    { label: 'Tue', value: 5 },
    { label: 'Wed', value: 2 },
    { label: 'Thu', value: 7 },
    { label: 'Fri', value: 4 },
    { label: 'Sat', value: 6 },
    { label: 'Sun', value: 1 },
  ];
  
  const revenueData = [
    { label: 'Week 1', value: 850 },
    { label: 'Week 2', value: 1200 },
    { label: 'Week 3', value: 750 },
    { label: 'Week 4', value: 1500 },
  ];
  
  const serviceData = [
    { label: 'Therapy', value: 45 },
    { label: 'Support', value: 30 },
    { label: 'Transport', value: 15 },
    { label: 'Other', value: 10 },
  ];
  
  return (
    <View style={styles.container}>
      <AppHeader title="Provider Analytics" showBackButton={true} />

      <ScrollView style={styles.content}>
        {/* Summary Cards */}
        <View style={styles.summaryCards}>
          <View style={styles.summaryCard}>
            <View style={[styles.iconContainer, styles.bookingsIcon]}>
              <Calendar size={24} color="#007AFF" />
            </View>
            <View>
              <Text style={styles.metricLabel}>Total Bookings</Text>
              <Text style={styles.metricValue}>28</Text>
              <Text style={styles.metricTrend}>+12% from last month</Text>
            </View>
          </View>
          
          <View style={styles.summaryCard}>
            <View style={[styles.iconContainer, styles.revenueIcon]}>
              <DollarSign size={24} color="#4CD964" />
            </View>
            <View>
              <Text style={styles.metricLabel}>Total Revenue</Text>
              <Text style={styles.metricValue}>$4,300</Text>
              <Text style={styles.metricTrend}>+8% from last month</Text>
            </View>
          </View>
          
          <View style={styles.summaryCard}>
            <View style={[styles.iconContainer, styles.clientsIcon]}>
              <Users size={24} color="#FF9500" />
            </View>
            <View>
              <Text style={styles.metricLabel}>New Clients</Text>
              <Text style={styles.metricValue}>12</Text>
              <Text style={styles.metricTrend}>+4% from last month</Text>
            </View>
          </View>
        </View>

        {/* Bookings Chart */}
        <View style={styles.chartSection}>
          <View style={styles.chartHeader}>
            <Text style={styles.chartTitle}>Bookings This Week</Text>
            <TouchableOpacity style={styles.periodPicker}>
              <Text style={styles.periodText}>This Week</Text>
              <ArrowLeft size={16} color="#666" style={{ transform: [{ rotate: '270deg' }] }} />
            </TouchableOpacity>
          </View>
          
          <BarGraph data={bookingData} />
          
          <View style={styles.chartFooter}>
            <Text style={styles.chartSummary}>
              You had <Text style={styles.highlight}>28 bookings</Text> this week
            </Text>
          </View>
        </View>

        {/* Revenue Chart */}
        <View style={styles.chartSection}>
          <View style={styles.chartHeader}>
            <Text style={styles.chartTitle}>Monthly Revenue</Text>
            <TouchableOpacity style={styles.periodPicker}>
              <Text style={styles.periodText}>This Month</Text>
              <ArrowLeft size={16} color="#666" style={{ transform: [{ rotate: '270deg' }] }} />
            </TouchableOpacity>
          </View>
          
          <BarGraph data={revenueData} />
          
          <View style={styles.chartFooter}>
            <Text style={styles.chartSummary}>
              Total revenue: <Text style={styles.highlight}>$4,300</Text>
            </Text>
          </View>
        </View>

        {/* Service Distribution */}
        <View style={styles.chartSection}>
          <View style={styles.chartHeader}>
            <Text style={styles.chartTitle}>Service Distribution</Text>
          </View>
          
          {/* Simple visualization for service distribution */}
          <View style={styles.distributionContainer}>
            {serviceData.map((item, index) => (
              <View key={index} style={styles.distributionItem}>
                <View style={styles.distributionLabelContainer}>
                  <View 
                    style={[
                      styles.distributionColorBox, 
                      { backgroundColor: getServiceColor(item.label) }
                    ]} 
                  />
                  <Text style={styles.distributionLabel}>{item.label}</Text>
                </View>
                <Text style={styles.distributionPercentage}>{item.value}%</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Export Data Button */}
        <TouchableOpacity style={styles.exportButton}>
          <BarChart3 size={20} color="#007AFF" />
          <Text style={styles.exportButtonText}>Export Analytics Data</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

// Helper to get color for service category
function getServiceColor(category: string) {
  switch (category) {
    case 'Therapy':
      return '#007AFF';
    case 'Support':
      return '#4CD964';
    case 'Transport':
      return '#FF9500';
    default:
      return '#5856D6';
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 24,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e1e1',
  },
  backButton: {
    marginRight: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  content: {
    flex: 1,
    padding: 24,
  },
  summaryCards: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 24,
  },
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    gap: 16,
    width: '100%',
    borderWidth: 1,
    borderColor: '#e1e1e1',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookingsIcon: {
    backgroundColor: '#e1f0ff',
  },
  revenueIcon: {
    backgroundColor: '#e6f7e9',
  },
  clientsIcon: {
    backgroundColor: '#fff3e0',
  },
  metricLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  metricTrend: {
    fontSize: 12,
    color: '#4CD964',
  },
  chartSection: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#e1e1e1',
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  periodPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e1e1e1',
  },
  periodText: {
    fontSize: 14,
    color: '#666',
    marginRight: 4,
  },
  chartFooter: {
    marginTop: 16,
    alignItems: 'center',
  },
  chartSummary: {
    fontSize: 16,
    color: '#666',
  },
  highlight: {
    fontWeight: '600',
    color: '#1a1a1a',
  },
  distributionContainer: {
    marginTop: 16,
    gap: 12,
  },
  distributionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  distributionLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  distributionColorBox: {
    width: 16,
    height: 16,
    borderRadius: 4,
  },
  distributionLabel: {
    fontSize: 16,
    color: '#1a1a1a',
  },
  distributionPercentage: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8f9fa',
    height: 56,
    borderRadius: 12,
    marginBottom: 32,
    gap: 8,
    borderWidth: 1,
    borderColor: '#e1e1e1',
  },
  exportButtonText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
});