import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Modal,
  TextInput,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { mobileApi } from '../services/api';
import { colors } from '../theme/colors';
import { StatusBadge } from '../components/StatusBadge';
import { PriorityBadge } from '../components/PriorityBadge';
import { LoadingView, ErrorView } from '../components/FeedbackViews';

export const ProjectDetailScreen = ({ route, navigation }) => {
  const { projectId } = route.params;

  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  // Task Modal (Create / Edit)
  const [taskModalVisible, setTaskModalVisible] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [taskName, setTaskName] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskPriority, setTaskPriority] = useState('MEDIUM');
  const [taskStatus, setTaskStatus] = useState('PENDING');
  const [savingTask, setSavingTask] = useState(false);

  const loadProject = async () => {
    try {
      setError('');
      const data = await mobileApi.getProject(projectId);
      setProject(data);
    } catch (err) {
      setError(err.message || 'Failed to load project details.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadProject();
  }, [projectId]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadProject();
  }, [projectId]);

  const openCreateTaskModal = () => {
    setEditingTask(null);
    setTaskName('');
    setTaskDesc('');
    setTaskPriority('MEDIUM');
    setTaskStatus('PENDING');
    setTaskModalVisible(true);
  };

  const openEditTaskModal = (task) => {
    setEditingTask(task);
    setTaskName(task.name);
    setTaskDesc(task.description || '');
    setTaskPriority(task.priority || 'MEDIUM');
    setTaskStatus(task.status || 'PENDING');
    setTaskModalVisible(true);
  };

  const handleSaveTask = async () => {
    if (!taskName.trim()) {
      Alert.alert('Validation Error', 'Task name is required.');
      return;
    }

    setSavingTask(true);
    try {
      const payload = {
        projectId,
        name: taskName.trim(),
        description: taskDesc.trim() || null,
        priority: taskPriority,
        status: taskStatus,
      };

      if (editingTask) {
        await mobileApi.updateTask(editingTask.id, payload);
      } else {
        await mobileApi.createTask(payload);
      }

      setTaskModalVisible(false);
      loadProject();
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to save task.');
    } finally {
      setSavingTask(false);
    }
  };

  const handleToggleTask = async (task) => {
    const newStatus = task.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED';
    const prevProject = project;

    if (project) {
      const updatedTasks = (project.tasks || []).map((t) =>
        t.id === task.id ? { ...t, status: newStatus } : t
      );
      const totalTasks = updatedTasks.length;
      const completedTasks = updatedTasks.filter((t) => t.status === 'COMPLETED').length;
      const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

      setProject({
        ...project,
        tasks: updatedTasks,
        completedTaskCount: completedTasks,
        progress: progressPercentage,
      });
    }

    try {
      await mobileApi.updateTask(task.id, { status: newStatus });
      loadProject();
    } catch (err) {
      setProject(prevProject);
      console.log('Error toggling task:', err.message);
    }
  };

  const confirmDeleteTask = (task) => {
    Alert.alert('Delete Task', `Are you sure you want to delete "${task.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await mobileApi.deleteTask(task.id);
            loadProject();
          } catch (err) {
            Alert.alert('Error', err.message || 'Failed to delete task.');
          }
        },
      },
    ]);
  };

  const confirmDeleteProject = () => {
    Alert.alert(
      'Delete Project',
      `Are you sure you want to delete "${project.name}"? All tasks will be removed.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await mobileApi.deleteProject(projectId);
              navigation.goBack();
            } catch (err) {
              Alert.alert('Error', err.message || 'Failed to delete project.');
            }
          },
        },
      ]
    );
  };

  if (loading && !refreshing) {
    return <LoadingView message="Loading project details..." />;
  }

  if (error || !project) {
    return <ErrorView message={error || 'Project not found.'} onRetry={loadProject} />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
          />
        }
      >
        {/* Project Header Card */}
        <View style={styles.headerCard}>
          <View style={styles.headerRow}>
            <Text style={styles.projectTitle}>{project.name}</Text>
            <StatusBadge status={project.status} />
          </View>

          {project.description ? (
            <Text style={styles.projectDesc}>{project.description}</Text>
          ) : null}

          {/* Progress Section */}
          <View style={styles.progressContainer}>
            <View style={styles.progressRow}>
              <Text style={styles.progressLabel}>Overall Progress</Text>
              <Text style={styles.progressText}>{project.progress || 0}%</Text>
            </View>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${project.progress || 0}%` }]} />
            </View>
            <Text style={styles.taskCountText}>
              {project.completedTaskCount || 0} of {project.taskCount || 0} tasks completed
            </Text>
          </View>

          <TouchableOpacity style={styles.deleteProjectBtn} onPress={confirmDeleteProject}>
            <Text style={styles.deleteProjectBtnText}>Delete Project</Text>
          </TouchableOpacity>
        </View>

        {/* Tasks Section Header */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Tasks ({project.tasks?.length || 0})</Text>
          <TouchableOpacity style={styles.addTaskBtn} onPress={openCreateTaskModal}>
            <Text style={styles.addTaskBtnText}>+ Add Task</Text>
          </TouchableOpacity>
        </View>

        {/* Task List */}
        {project.tasks && project.tasks.length > 0 ? (
          project.tasks.map((task) => (
            <View key={task.id} style={styles.taskCard}>
              <View style={styles.taskRow}>
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
                  {task.description ? (
                    <Text style={styles.taskDesc} numberOfLines={2}>
                      {task.description}
                    </Text>
                  ) : null}
                </View>

                <PriorityBadge priority={task.priority} />
              </View>

              <View style={styles.taskFooter}>
                <StatusBadge status={task.status} />
                <View style={styles.taskActions}>
                  <TouchableOpacity
                    style={styles.taskActionBtn}
                    onPress={() => openEditTaskModal(task)}
                  >
                    <Text style={styles.taskActionBtnText}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.taskActionBtnDanger}
                    onPress={() => confirmDeleteTask(task)}
                  >
                    <Text style={styles.taskActionBtnDangerText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.emptyTasksBox}>
            <Text style={styles.emptyTasksText}>No tasks added to this project yet.</Text>
            <TouchableOpacity style={styles.emptyAddBtn} onPress={openCreateTaskModal}>
              <Text style={styles.emptyAddBtnText}>Add First Task</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Task Create / Edit Modal */}
      <Modal visible={taskModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{editingTask ? 'Edit Task' : 'Create Task'}</Text>

            <Text style={styles.inputLabel}>TASK NAME *</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g. Implement REST API"
              value={taskName}
              onChangeText={setTaskName}
            />

            <Text style={styles.inputLabel}>DESCRIPTION</Text>
            <TextInput
              style={[styles.modalInput, { height: 70 }]}
              placeholder="Task details..."
              value={taskDesc}
              onChangeText={setTaskDesc}
              multiline
            />

            <Text style={styles.inputLabel}>PRIORITY</Text>
            <View style={styles.statusSelectRow}>
              {['LOW', 'MEDIUM', 'HIGH'].map((pr) => (
                <TouchableOpacity
                  key={pr}
                  style={[
                    styles.statusSelectOption,
                    taskPriority === pr && styles.statusSelectOptionActive,
                  ]}
                  onPress={() => setTaskPriority(pr)}
                >
                  <Text
                    style={[
                      styles.statusSelectOptionText,
                      taskPriority === pr && styles.statusSelectOptionTextActive,
                    ]}
                  >
                    {pr}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.inputLabel}>STATUS</Text>
            <View style={styles.statusSelectRow}>
              {['PENDING', 'IN_PROGRESS', 'COMPLETED'].map((st) => (
                <TouchableOpacity
                  key={st}
                  style={[
                    styles.statusSelectOption,
                    taskStatus === st && styles.statusSelectOptionActive,
                  ]}
                  onPress={() => setTaskStatus(st)}
                >
                  <Text
                    style={[
                      styles.statusSelectOptionText,
                      taskStatus === st && styles.statusSelectOptionTextActive,
                    ]}
                  >
                    {st === 'PENDING' ? 'Pending' : st === 'IN_PROGRESS' ? 'In Progress' : 'Done'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setTaskModalVisible(false)}
                disabled={savingTask}
              >
                <Text style={styles.modalCancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSaveBtn}
                onPress={handleSaveTask}
                disabled={savingTask}
              >
                {savingTask ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.modalSaveBtnText}>
                    {editingTask ? 'Save Changes' : 'Create Task'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  headerCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  projectTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
    flex: 1,
    marginRight: 8,
  },
  projectDesc: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 14,
    lineHeight: 18,
  },
  progressContainer: {
    marginBottom: 14,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  progressLabel: {
    fontSize: 11,
    color: colors.textMuted,
  },
  progressText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  progressBarBg: {
    height: 7,
    backgroundColor: colors.borderLight,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.primary,
  },
  taskCountText: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 6,
  },
  deleteProjectBtn: {
    alignSelf: 'flex-start',
    paddingVertical: 6,
  },
  deleteProjectBtnText: {
    fontSize: 12,
    color: colors.danger,
    fontWeight: '600',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  addTaskBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  addTaskBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  taskCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
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
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  taskNameCompleted: {
    textDecorationLine: 'line-through',
    color: colors.textMuted,
  },
  taskDesc: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  taskFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  taskActions: {
    flexDirection: 'row',
    gap: 8,
  },
  taskActionBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: colors.borderLight,
  },
  taskActionBtnText: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  taskActionBtnDanger: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: colors.dangerLight,
  },
  taskActionBtnDangerText: {
    fontSize: 11,
    color: colors.dangerText,
    fontWeight: '600',
  },
  emptyTasksBox: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyTasksText: {
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: 12,
  },
  emptyAddBtn: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  emptyAddBtnText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: 4,
    marginTop: 8,
  },
  modalInput: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: colors.textPrimary,
  },
  statusSelectRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 4,
  },
  statusSelectOption: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  statusSelectOptionActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  statusSelectOptionText: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  statusSelectOptionTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 20,
  },
  modalCancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 8,
    backgroundColor: colors.borderLight,
  },
  modalCancelBtnText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  modalSaveBtn: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 8,
    backgroundColor: colors.primary,
  },
  modalSaveBtnText: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
