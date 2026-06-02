import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/theme/Theme';
import { useTaskStore } from '@/store/taskStore';
import { QUADRANT_META } from '@/theme/quadrantThemes';
import { Spacing, Radius, Shadow, Typography, MIN_TOUCH_TARGET } from '@/theme/spacing';
import { QUADRANT_IDS } from '@/utils/quadrants';
import { t } from '@/i18n';
import type { Task, QuadrantId, RecurrenceType } from '@/types';

const RECURRENCE_OPTIONS: RecurrenceType[] = ['none', 'daily', 'weekly', 'monthly'];

interface TaskModalProps {
  visible: boolean;
  task?: Task | null;
  defaultQuadrant?: QuadrantId;
  onClose: () => void;
}

export function TaskModal({ visible, task, defaultQuadrant = 'q1', onClose }: TaskModalProps) {
  const { colors, mode, getQuadrantStyle } = useTheme();
  const addTask = useTaskStore((s) => s.addTask);
  const updateTask = useTaskStore((s) => s.updateTask);
  const deleteTask = useTaskStore((s) => s.deleteTask);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [quadrant, setQuadrant] = useState<QuadrantId>(defaultQuadrant);
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [recurrence, setRecurrence] = useState<RecurrenceType>('none');
  const [showDatePicker, setShowDatePicker] = useState(false);

  const slideAnim = useRef(new Animated.Value(400)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const titleRef = useRef<TextInput>(null);

  const isEditing = !!task;

  useEffect(() => {
    if (visible) {
      if (task) {
        setTitle(task.title);
        setDescription(task.description ?? '');
        setQuadrant(task.quadrant);
        setDueDate(task.dueDate ? new Date(task.dueDate) : null);
        setRecurrence(task.recurrence ?? 'none');
      } else {
        setTitle('');
        setDescription('');
        setQuadrant(defaultQuadrant);
        setDueDate(null);
        setRecurrence('none');
      }
      Animated.parallel([
        Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, damping: 22, stiffness: 220 }),
        Animated.timing(opacityAnim, { toValue: 1, duration: 180, useNativeDriver: true }),
      ]).start(() => {
        setTimeout(() => titleRef.current?.focus(), 50);
      });
    } else {
      setShowDatePicker(false);
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: 400, duration: 200, useNativeDriver: true }),
        Animated.timing(opacityAnim, { toValue: 0, duration: 180, useNativeDriver: true }),
      ]).start();
    }
  }, [visible, task, defaultQuadrant]);

  function handleSave() {
    if (!title.trim()) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if (isEditing && task) {
      updateTask(task.id, {
        title: title.trim(),
        description: description.trim() || undefined,
        quadrant,
        dueDate: dueDate?.getTime(),
        recurrence,
      });
    } else {
      addTask({
        title: title.trim(),
        description: description.trim() || undefined,
        quadrant,
        dueDate: dueDate?.getTime(),
        recurrence,
      });
    }
    onClose();
  }

  function handleDelete() {
    if (task) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      deleteTask(task.id);
      onClose();
    }
  }

  const selectedStyle = getQuadrantStyle(quadrant);

  return (
    <>
      {/* ── Task sheet Modal ── */}
      <Modal
        visible={visible}
        transparent
        animationType="none"
        statusBarTranslucent
        onRequestClose={onClose}
      >
        <KeyboardAvoidingView
          style={styles.wrapper}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <Animated.View style={[styles.backdrop, { opacity: opacityAnim }]}>
            <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
          </Animated.View>

          <Animated.View
            style={[
              styles.sheet,
              { backgroundColor: colors.surface, transform: [{ translateY: slideAnim }] },
              Shadow.lg,
            ]}
          >
            {/* Handle */}
            <View style={[styles.handle, { backgroundColor: colors.border }]} />

            {/* Header */}
            <View style={styles.sheetHeader}>
              <Text style={[styles.sheetTitle, { color: colors.text }]} maxFontSizeMultiplier={1.2}>
                {isEditing ? t('tasks.editTask') : t('tasks.newTask')}
              </Text>
              <TouchableOpacity
                onPress={onClose}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                style={[styles.closeBtn, { backgroundColor: colors.surfaceSecondary }]}
              >
                <Ionicons name="close" size={16} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.content}
            >
              {/* Title */}
              <TextInput
                ref={titleRef}
                style={[
                  styles.titleInput,
                  {
                    color: colors.text,
                    borderBottomColor: title ? selectedStyle.accent : colors.borderLight,
                  },
                ]}
                placeholder={t('tasks.titlePlaceholder')}
                placeholderTextColor={colors.textTertiary}
                value={title}
                onChangeText={setTitle}
                returnKeyType="next"
                maxLength={120}
                maxFontSizeMultiplier={1.3}
              />

              {/* Description */}
              <TextInput
                style={[
                  styles.descInput,
                  {
                    color: colors.text,
                    borderColor: colors.borderLight,
                    backgroundColor: colors.surfaceSecondary,
                  },
                ]}
                placeholder={t('tasks.descPlaceholder')}
                placeholderTextColor={colors.textTertiary}
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                maxLength={500}
                maxFontSizeMultiplier={1.2}
              />

              {/* Quadrant selector */}
              <Text style={[styles.sectionLabel, { color: colors.textTertiary }]} maxFontSizeMultiplier={1.1}>
                {t('tasks.quadrant')}
              </Text>
              <View style={styles.quadrantGrid}>
                {QUADRANT_IDS.map((id) => {
                  const meta = QUADRANT_META[id];
                  const qStyle = getQuadrantStyle(id);
                  const selected = quadrant === id;
                  return (
                    <TouchableOpacity
                      key={id}
                      onPress={() => {
                        Haptics.selectionAsync();
                        setQuadrant(id);
                      }}
                      style={[
                        styles.quadrantBtn,
                        {
                          backgroundColor: selected ? qStyle.accent : colors.surfaceSecondary,
                          borderColor: selected ? qStyle.accent : colors.borderLight,
                        },
                      ]}
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name={meta.icon as any}
                        size={14}
                        color={selected ? '#FFFFFF' : colors.textSecondary}
                      />
                      <Text
                        style={[
                          styles.quadrantBtnText,
                          { color: selected ? '#FFFFFF' : colors.textSecondary },
                        ]}
                        maxFontSizeMultiplier={1.1}
                      >
                        {t(`quadrants.${id}.short`)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Due date */}
              <Text style={[styles.sectionLabel, { color: colors.textTertiary }]} maxFontSizeMultiplier={1.1}>
                {t('tasks.dueDate')}
              </Text>
              <View style={styles.dueDateRow}>
                <TouchableOpacity
                  style={[
                    styles.dateBtn,
                    {
                      backgroundColor: dueDate ? selectedStyle.accent + '18' : colors.surfaceSecondary,
                      borderColor: dueDate ? selectedStyle.accent : colors.borderLight,
                    },
                  ]}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setShowDatePicker(true);
                  }}
                >
                  <Ionicons
                    name="calendar-outline"
                    size={16}
                    color={dueDate ? selectedStyle.accent : colors.textSecondary}
                  />
                  <Text
                    style={[styles.dateBtnText, { color: dueDate ? selectedStyle.accent : colors.textSecondary }]}
                    maxFontSizeMultiplier={1.2}
                  >
                    {dueDate
                      ? dueDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
                      : t('tasks.setDueDate')}
                  </Text>
                </TouchableOpacity>
                {dueDate && (
                  <TouchableOpacity
                    onPress={() => setDueDate(null)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Ionicons name="close-circle" size={20} color={colors.textTertiary} />
                  </TouchableOpacity>
                )}
              </View>

              {/* Recurrence */}
              <Text style={[styles.sectionLabel, { color: colors.textTertiary }]} maxFontSizeMultiplier={1.1}>
                {t('tasks.recurrence')}
              </Text>
              <View style={styles.recurrenceRow}>
                {RECURRENCE_OPTIONS.map((opt) => {
                  const selected = recurrence === opt;
                  return (
                    <TouchableOpacity
                      key={opt}
                      onPress={() => {
                        Haptics.selectionAsync();
                        setRecurrence(opt);
                      }}
                      style={[
                        styles.recurrenceBtn,
                        {
                          backgroundColor: selected ? selectedStyle.accent : colors.surfaceSecondary,
                          borderColor: selected ? selectedStyle.accent : colors.borderLight,
                        },
                      ]}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.recurrenceBtnText,
                          { color: selected ? '#FFFFFF' : colors.textSecondary },
                        ]}
                        maxFontSizeMultiplier={1.1}
                      >
                        {t(`recurrence.${opt}`)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>

            {/* Actions */}
            <View style={[styles.actions, { borderTopColor: colors.borderLight }]}>
              {isEditing && (
                <TouchableOpacity
                  style={[styles.deleteBtn, { borderColor: colors.borderLight }]}
                  onPress={handleDelete}
                >
                  <Ionicons name="trash-outline" size={18} color={colors.error} />
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[
                  styles.saveBtn,
                  { backgroundColor: title.trim() ? selectedStyle.accent : colors.border },
                ]}
                onPress={handleSave}
                disabled={!title.trim()}
                activeOpacity={0.8}
              >
                <Text style={styles.saveBtnText} maxFontSizeMultiplier={1.1}>
                  {isEditing ? t('tasks.saveChanges') : t('tasks.addTask')}
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </KeyboardAvoidingView>
      </Modal>

      {/*
       * ── iOS Date Picker ──
       * Separate Modal overlay with inline DateTimePicker.
       * Auto-close on date selection.
       */}
      {Platform.OS === 'ios' && showDatePicker && (
        <Modal
          visible
          transparent
          animationType="fade"
          statusBarTranslucent
          onRequestClose={() => setShowDatePicker(false)}
        >
          <Pressable style={styles.iosDateBackdrop} onPress={() => setShowDatePicker(false)}>
            <Pressable style={[styles.iosDateCard, { backgroundColor: colors.surface }]}>
              <DateTimePicker
                value={dueDate ?? new Date()}
                mode="date"
                display="inline"
                minimumDate={new Date()}
                onChange={(_, date) => {
                  if (date) {
                    setDueDate(date);
                    setShowDatePicker(false);
                  }
                }}
                accentColor={selectedStyle.accent}
                themeVariant={mode === 'dark' ? 'dark' : 'light'}
              />
            </Pressable>
          </Pressable>
        </Modal>
      )}

      {/*
       * ── Android Date Picker ──
       * Rendered OUTSIDE any Modal → native Dialog appears correctly
       * above the task sheet. Selection or cancel → unmounts component.
       */}
      {Platform.OS === 'android' && showDatePicker && (
        <DateTimePicker
          value={dueDate ?? new Date()}
          mode="date"
          display="default"
          minimumDate={new Date()}
          onChange={(_, date) => {
            setShowDatePicker(false);
            if (date) setDueDate(date);
          }}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet: {
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    paddingBottom: Platform.OS === 'ios' ? 34 : Spacing.lg,
    maxHeight: '92%',
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
  },
  sheetTitle: { ...Typography.headline },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { paddingHorizontal: Spacing.xl, paddingBottom: Spacing.md, gap: Spacing.sm },
  titleInput: {
    ...Typography.body,
    fontWeight: '500',
    borderBottomWidth: 2,
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  descInput: {
    ...Typography.callout,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Radius.md,
    padding: Spacing.md,
    minHeight: 80,
    marginBottom: Spacing.xs,
  },
  sectionLabel: {
    ...Typography.caption2Semi,
    letterSpacing: 0.8,
    marginBottom: Spacing.xs,
    marginTop: Spacing.sm,
  },
  quadrantGrid: { flexDirection: 'row', gap: Spacing.sm },
  quadrantBtn: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    gap: 4,
    minHeight: MIN_TOUCH_TARGET,
  },
  quadrantBtnText: { ...Typography.caption1, fontWeight: '600' },
  dueDateRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  dateBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    minHeight: MIN_TOUCH_TARGET,
  },
  dateBtnText: { ...Typography.callout, fontWeight: '500' },
  recurrenceRow: { flexDirection: 'row', gap: Spacing.xs, flexWrap: 'wrap' },
  recurrenceBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    minHeight: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recurrenceBtnText: { ...Typography.caption1, fontWeight: '600' },
  actions: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    gap: Spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  deleteBtn: {
    width: MIN_TOUCH_TARGET,
    height: MIN_TOUCH_TARGET,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtn: {
    flex: 1,
    height: MIN_TOUCH_TARGET,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: { color: '#FFFFFF', ...Typography.callout, fontWeight: '700' },
  // iOS date picker overlay
  iosDateBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  iosDateCard: {
    width: '100%',
    maxWidth: 380,
    borderRadius: Radius.xl,
    overflow: 'hidden',
  },
});
