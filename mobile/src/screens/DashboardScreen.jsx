import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { mobileApi } from '../services/api';
import { colors } from '../theme/colors';
import { StatusBadge } from '../components/StatusBadge';
import { PriorityBadge } from '../components/PriorityBadge';
import { LoadingView, ErrorView } from '../components/FeedbackViews';

export const DashboardScreen = ({ navigation }) => {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const loadDashboard = async () => {
    try {
      setError('');
      const data = await mobileApi.getDashboard();
      setStats(data);
    } catch (err) {
      setError(err.message || 'Failed to load dashboard data.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadDashboard();
  }, []);

  const handleToggleTask = async (task) => {
    const newStatus = task.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED';
    const prevStats = stats;

    if (stats) {
      const isNowCompleted = newStatus === 'COMPLETED';
      setStats({
        ...stats,
        completedTasks: Math.max(0, (stats.completedTasks || 0) + (isNowCompleted ? 1 : -1)),
        pendingTasks: Math.max(0, (stats.pendingTasks || 0) + (isNowCompleted ? -1 : 1)),
        recentTasks: (stats.recentTasks || []).map((t) =>
          t.id === task.id ? { ...t, status: newStatus } : t
        ),
      });
    }

    try {
      await mobileApi.updateTask(task.id, { status: newStatus });
      await loadDashboard();
    } catch (err) {
      setStats(prevStats);
      console.log('Error toggling task:', err.message);
    }
  };

  if (loading && !refreshing) {
    return <LoadingView message="Loading your metrics..." />;
  }

  if (error && !stats) {
    return <ErrorView message={error} onRetry={loadDashboard} />;
  }

  const statCards = [
    { title: 'Total Projects', value: stats?.totalProjects || 0, bg: '#EFF6FF', color: '#1D4ED8' },
    { title: 'In Progress', value: stats?.projectsInProgress || 0, bg: '#EEF2FF', color: '#4338CA' },
    { title: 'Total Tasks', value: stats?.totalTasks || 0, bg: '#F1F5F9', color: '#334155' },
    { title: 'Completed Tasks', value: stats?.completedTasks || 0, bg: '#DCFCE7', color: '#15803D' },
    { title: 'Pending Tasks', value: stats?.pendingTasks || 0, bg: '#FEF3C7', color: '#B45309' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
        }
      >
        {/* Header Bar */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerGreeting}>Welcome back,</Text>
            <Text style={styles.headerName}>{user?.fullName || 'User'}</Text>
          </View>
          <TouchableOpacity style={styles.logoutButton} onPress={logout}>
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
        </View>

        {/* Network / General error banner if present while refreshing */}
        {error ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorBannerText}>{error}</Text>
          </View>
        ) : null}

        {/* Stat Cards Carousel / Grid */}
        <View style={styles.statsGrid}>
          {statCards.map((stat, idx) => (
            <View key={idx} style={[styles.statCard, { backgroundColor: stat.bg }]}>
              <Text style={styles.statLabel}>{stat.title}</Text>
              <Text style={[styles.statValue, { color: stat.color }]}>{stat.value}</Text>
            </View>
          ))}
        </View>

        {/* Recent Projects */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Projects</Text>
            <TouchableOpacity onPress={() => navigation.navigate('ProjectsTab')}>
              <Text style={styles.seeAllText}>View all</Text>
            </TouchableOpacity>
          </View>

          {stats?.recentProjects && stats.recentProjects.length > 0 ? (
            stats.recentProjects.map((project) => (
              <TouchableOpacity
                key={project.id}
                style={styles.projectItem}
                onPress={() => navigation.navigate('ProjectDetail', { projectId: project.id })}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.projectName}>{project.name}</Text>
                  <Text style={styles.projectSubtext}>{project.taskCount || 0} tasks</Text>
                </View>
                <StatusBadge status={project.status} />
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyCardText}>No projects yet</Text>
            </View>
          )}
        </View>

        {/* Recent Tasks */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Tasks</Text>
            <TouchableOpacity onPress={() => navigation.navigate('TasksTab')}>
              <Text style={styles.seeAllText}>View all</Text>
            </TouchableOpacity>
          </View>

          {stats?.recentTasks && stats.recentTasks.length > 0 ? (
            stats.recentTasks.map((task) => (
              <View key={task.id} style={styles.taskItem}>
                <TouchableOpacity
                  style={[
                    styles.checkbox,
                    task.status === 'COMPLETED' && styles.checkboxCompleted,
                  ]}
                  onPress={() => handleToggleTask(task)}
                >
                  {task.status === 'COMPLETED' && <Text style={styles.checkmark}>✓</Text>}
                </TouchableOpacity>

                <View style={{ flex: 1, marginHorizontal: 10 }}>
                  <Text
                    style={[
                      styles.taskName,
                      task.status === 'COMPLETED' && styles.taskNameCompleted,
                    ]}
                  >
                    {task.name}
                  </Text>
                  {task.project?.name ? (
                    <Text style={styles.taskProjectName}>{task.project.name}</Text>
                  ) : null}
                </View>

                <PriorityBadge priority={task.priority} />
              </View>
            ))
          ) : (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyCardText}>No tasks yet</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 8,
  },
  headerGreeting: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  headerName: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  logoutButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  logoutButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.danger,
  },
  errorBanner: {
    backgroundColor: colors.dangerLight,
    padding: 10,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorBannerText: {
    color: colors.dangerText,
    fontSize: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statCard: {
    width: '48%',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
  },
  section: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  seeAllText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
  projectItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  projectName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  projectSubtext: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxCompleted: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  taskName: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  taskNameCompleted: {
    textDecorationLine: 'line-through',
    color: colors.textMuted,
  },
  taskProjectName: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  emptyCard: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  emptyCardText: {
    fontSize: 12,
    color: colors.textMuted,
  },
});
