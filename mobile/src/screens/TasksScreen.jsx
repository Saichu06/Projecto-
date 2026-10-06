import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Modal,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { mobileApi } from '../services/api';
import { colors } from '../theme/colors';
import { StatusBadge } from '../components/StatusBadge';
import { PriorityBadge } from '../components/PriorityBadge';
import { LoadingView, ErrorView, EmptyView } from '../components/FeedbackViews';

const statusFilters = [
  { label: 'All', value: '' },
  { label: 'Pending', value: 'PENDING' },
  { label: 'In Progress', value: 'IN_PROGRESS' },
  { label: 'Done', value: 'COMPLETED' },
];

const priorityFilters = [
  { label: 'All', value: '' },
  { label: 'High', value: 'HIGH' },
  { label: 'Medium', value: 'MEDIUM' },
  { label: 'Low', value: 'LOW' },
];

export const TasksScreen = ({ navigation }) => {
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');

  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formPriority, setFormPriority] = useState('MEDIUM');
  const [formStatus, setFormStatus] = useState('PENDING');
  const [saving, setSaving] = useState(false);

  const loadTasksAndProjects = async () => {
    try {
      setError('');
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (statusFilter) params.status = statusFilter;
      if (priorityFilter) params.priority = priorityFilter;

      const [tasksData, projectsData] = await Promise.all([
        mobileApi.getTasks(params),
        mobileApi.getProjects(),
      ]);

      setTasks(tasksData || []);
      setProjects(projectsData || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch tasks.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadTasksAndProjects();
  }, [search, statusFilter, priorityFilter]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadTasksAndProjects();
  }, [search, statusFilter, priorityFilter]);

  const openCreateModal = () => {
    if (projects.length === 0) {
      Alert.alert('No Projects Found', 'Please create a project first before creating tasks.');
      return;
    }
    setEditingTask(null);
    setSelectedProjectId(projects[0].id);
    setFormName('');
    setFormDesc('');
    setFormPriority('MEDIUM');
    setFormStatus('PENDING');
    setModalVisible(true);
  };

  const openEditModal = (task) => {
    setEditingTask(task);
    setSelectedProjectId(task.projectId);
    setFormName(task.name);
    setFormDesc(task.description || '');
    setFormPriority(task.priority || 'MEDIUM');
    setFormStatus(task.status || 'PENDING');
    setModalVisible(true);
  };

  const handleSaveTask = async () => {
    if (!selectedProjectId) {
      Alert.alert('Validation Error', 'Please select a project.');
      return;
    }
    if (!formName.trim()) {
      Alert.alert('Validation Error', 'Task name is required.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        projectId: selectedProjectId,
        name: formName.trim(),
        description: formDesc.trim() || null,
        priority: formPriority,
        status: formStatus,
      };

      if (editingTask) {
        await mobileApi.updateTask(editingTask.id, payload);
      } else {
        await mobileApi.createTask(payload);
      }

      setModalVisible(false);
      loadTasksAndProjects();
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to save task.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleTask = async (task) => {
    const newStatus = task.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED';
    const prevTasks = [...tasks];

    // Optimistic UI update
    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, status: newStatus } : t))
    );

    try {
      await mobileApi.updateTask(task.id, { status: newStatus });
      loadTasksAndProjects();
    } catch (err) {
      setTasks(prevTasks);
      console.log('Error toggling task:', err.message);
    }
  };

  const confirmDelete = (task) => {
    Alert.alert('Delete Task', `Are you sure you want to delete "${task.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await mobileApi.deleteTask(task.id);
            loadTasksAndProjects();
          } catch (err) {
            Alert.alert('Error', err.message || 'Failed to delete task.');
          }
        },
      },
    ]);
  };

  const renderTaskItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <TouchableOpacity
          style={[styles.checkbox, item.status === 'COMPLETED' && styles.checkboxCompleted]}
          onPress={() => handleToggleTask(item)}
        >
          {item.status === 'COMPLETED' && <Text style={styles.checkmark}>✓</Text>}
        </TouchableOpacity>

        <View style={{ flex: 1, marginHorizontal: 10 }}>
          <Text
            style={[styles.taskTitle, item.status === 'COMPLETED' && styles.taskTitleCompleted]}
          >
            {item.name}
          </Text>
          {item.project?.name ? (
            <Text style={styles.projectTag}>{item.project.name}</Text>
          ) : null}
          {item.description ? (
            <Text style={styles.taskDesc} numberOfLines={2}>
              {item.description}
            </Text>
          ) : null}
        </View>

        <PriorityBadge priority={item.priority} />
      </View>

      <View style={styles.cardFooter}>
        <StatusBadge status={item.status} />
        <View style={styles.cardActions}>
          <TouchableOpacity style={styles.actionBtn} onPress={() => openEditModal(item)}>
            <Text style={styles.actionBtnText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtnDanger} onPress={() => confirmDelete(item)}>
            <Text style={styles.actionBtnDangerText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header and Search */}
      <View style={styles.topBar}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search tasks..."
          placeholderTextColor={colors.textMuted}
          value={search}
          onChangeText={setSearch}
        />
        <TouchableOpacity style={styles.newButton} onPress={openCreateModal}>
          <Text style={styles.newButtonText}>+ New</Text>
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterSection}>
        <View style={styles.filterRow}>
          {statusFilters.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              style={[styles.filterChip, statusFilter === opt.value && styles.filterChipActive]}
              onPress={() => setStatusFilter(opt.value)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  statusFilter === opt.value && styles.filterChipTextActive,
                ]}
              >
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.filterRow}>
          {priorityFilters.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              style={[styles.priorityChip, priorityFilter === opt.value && styles.priorityChipActive]}
              onPress={() => setPriorityFilter(opt.value)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  priorityFilter === opt.value && styles.filterChipTextActive,
                ]}
              >
                {opt.label} Priority
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Task List */}
      {loading && !refreshing ? (
        <LoadingView message="Loading tasks..." />
      ) : error && tasks.length === 0 ? (
        <ErrorView message={error} onRetry={loadTasksAndProjects} />
      ) : tasks.length === 0 ? (
        <EmptyView
          title="No tasks found"
          description={
            projects.length === 0
              ? 'Create a project first, then add tasks.'
              : 'Add your first task to get organized.'
          }
          actionLabel={projects.length > 0 ? 'New Task' : undefined}
          onAction={projects.length > 0 ? openCreateModal : undefined}
        />
      ) : (
        <FlatList
          data={tasks}
          keyExtractor={(item) => item.id}
          renderItem={renderTaskItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
            />
          }
        />
      )}

      {/* Create / Edit Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{editingTask ? 'Edit Task' : 'Create New Task'}</Text>

            <Text style={styles.inputLabel}>PROJECT *</Text>
            <View style={styles.projectSelectRow}>
              {projects.map((p) => (
                <TouchableOpacity
                  key={p.id}
                  style={[
                    styles.projectChip,
                    selectedProjectId === p.id && styles.projectChipActive,
                  ]}
                  onPress={() => setSelectedProjectId(p.id)}
                >
                  <Text
                    style={[
                      styles.projectChipText,
                      selectedProjectId === p.id && styles.projectChipTextActive,
                    ]}
                    numberOfLines={1}
                  >
                    {p.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.inputLabel}>TASK NAME *</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g. Implement search API"
              value={formName}
              onChangeText={setFormName}
            />

            <Text style={styles.inputLabel}>DESCRIPTION</Text>
            <TextInput
              style={[styles.modalInput, { height: 70 }]}
              placeholder="Task details..."
              value={formDesc}
              onChangeText={setFormDesc}
              multiline
            />

            <Text style={styles.inputLabel}>PRIORITY</Text>
            <View style={styles.statusSelectRow}>
              {['LOW', 'MEDIUM', 'HIGH'].map((pr) => (
                <TouchableOpacity
                  key={pr}
                  style={[
                    styles.statusSelectOption,
                    formPriority === pr && styles.statusSelectOptionActive,
                  ]}
                  onPress={() => setFormPriority(pr)}
                >
                  <Text
                    style={[
                      styles.statusSelectOptionText,
                      formPriority === pr && styles.statusSelectOptionTextActive,
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
                    formStatus === st && styles.statusSelectOptionActive,
                  ]}
                  onPress={() => setFormStatus(st)}
                >
                  <Text
                    style={[
                      styles.statusSelectOptionText,
                      formStatus === st && styles.statusSelectOptionTextActive,
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
                onPress={() => setModalVisible(false)}
                disabled={saving}
              >
                <Text style={styles.modalCancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSaveBtn}
                onPress={handleSaveTask}
                disabled={saving}
              >
                {saving ? (
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
  topBar: {
    flexDirection: 'row',
    padding: 16,
    paddingBottom: 8,
    alignItems: 'center',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: colors.textPrimary,
  },
  newButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 8,
  },
  newButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  filterSection: {
    paddingHorizontal: 16,
    paddingBottom: 10,
    gap: 6,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  filterChip: {
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  priorityChip: {
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  priorityChipActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  filterChipText: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  filterChipTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  listContent: {
    padding: 16,
    paddingTop: 4,
    paddingBottom: 32,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardHeader: {
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
  taskTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  taskTitleCompleted: {
    textDecorationLine: 'line-through',
    color: colors.textMuted,
  },
  projectTag: {
    fontSize: 11,
    color: colors.primary,
    fontWeight: '600',
    marginTop: 2,
  },
  taskDesc: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: colors.borderLight,
  },
  actionBtnText: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  actionBtnDanger: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: colors.dangerLight,
  },
  actionBtnDangerText: {
    fontSize: 11,
    color: colors.dangerText,
    fontWeight: '600',
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
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: 4,
    marginTop: 8,
  },
  projectSelectRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 4,
  },
  projectChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  projectChipActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  projectChipText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  projectChipTextActive: {
    color: colors.primary,
    fontWeight: '700',
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
    paddingVertical: 7,
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
    marginTop: 18,
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
