import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Platform,
  Animated,
  Pressable,
  Alert,
  KeyboardAvoidingView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/theme/Theme';
import { useTaskStore } from '@/store/taskStore';
import { usePremium } from '@/hooks/usePremium';
import { Spacing, Radius, Shadow, Typography, MIN_TOUCH_TARGET } from '@/theme/spacing';
import { t } from '@/i18n';
import type { Matrix } from '@/types';

interface Props {
  visible: boolean;
  onClose: () => void;
  onNavigatePremium: () => void;
}

export function MatrixPickerSheet({ visible, onClose, onNavigatePremium }: Props) {
  const { colors, mode } = useTheme();
  const { isPremium } = usePremium();

  const matrices = useTaskStore((s) => s.matrices);
  const currentMatrixId = useTaskStore((s) => s.currentMatrixId);
  const setCurrentMatrix = useTaskStore((s) => s.setCurrentMatrix);
  const addMatrix = useTaskStore((s) => s.addMatrix);
  const deleteMatrix = useTaskStore((s) => s.deleteMatrix);
  const renameMatrix = useTaskStore((s) => s.renameMatrix);

  const [creatingNew, setCreatingNew] = useState(false);
  const [newName, setNewName] = useState('');
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  const slideAnim = useRef(new Animated.Value(500)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const newInputRef = useRef<TextInput>(null);
  const renameInputRef = useRef<TextInput>(null);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (visible) {
      setCreatingNew(false);
      setNewName('');
      setRenamingId(null);
      setRenameValue('');
      Animated.parallel([
        Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, damping: 22, stiffness: 220 }),
        Animated.timing(opacityAnim, { toValue: 1, duration: 180, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: 500, duration: 200, useNativeDriver: true }),
        Animated.timing(opacityAnim, { toValue: 0, duration: 180, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  useEffect(() => {
    if (creatingNew) {
      setTimeout(() => {
        scrollRef.current?.scrollToEnd({ animated: true });
        newInputRef.current?.focus();
      }, 80);
    }
  }, [creatingNew]);

  useEffect(() => {
    if (renamingId) {
      setTimeout(() => renameInputRef.current?.focus(), 80);
    }
  }, [renamingId]);

  function handleSelectMatrix(id: string) {
    Haptics.selectionAsync();
    setCurrentMatrix(id);
    onClose();
  }

  function handleLongPress(matrix: Matrix) {
    if (matrix.id === 'default' && matrices.length === 1) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const actions: { text: string; onPress: () => void; style?: 'destructive' | 'cancel' | 'default' }[] = [];

    actions.push({
      text: t('matrices.rename'),
      onPress: () => {
        setRenamingId(matrix.id);
        setRenameValue(matrix.name);
      },
    });

    if (matrix.id !== 'default') {
      actions.push({
        text: t('matrices.delete'),
        style: 'destructive',
        onPress: () => {
          Alert.alert(
            t('matrices.delete'),
            t('matrices.deleteConfirm').replace('{{name}}', matrix.name),
            [
              { text: t('common.cancel'), style: 'cancel' },
              {
                text: t('matrices.delete'),
                style: 'destructive',
                onPress: () => {
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                  deleteMatrix(matrix.id);
                },
              },
            ]
          );
        },
      });
    }

    actions.push({ text: t('common.cancel'), style: 'cancel', onPress: () => {} });

    Alert.alert(
      matrix.name,
      undefined,
      actions.map((a) => ({ text: a.text, style: a.style, onPress: a.onPress }))
    );
  }

  function handleRenameConfirm() {
    if (!renameValue.trim() || !renamingId) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    renameMatrix(renamingId, renameValue.trim());
    setRenamingId(null);
    setRenameValue('');
  }

  function handleCreateNew() {
    if (!newName.trim()) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    addMatrix(newName.trim());
    setCreatingNew(false);
    setNewName('');
    onClose();
  }

  const FREE_MATRIX_LIMIT = 3;

  function handleNewMatrixPress() {
    if (!isPremium && matrices.length >= FREE_MATRIX_LIMIT) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      Alert.alert(
        t('common.premium'),
        t('matrices.premiumLimit'),
        [
          { text: t('common.cancel'), style: 'cancel' },
          { text: t('settings.unlockPremium'), onPress: () => { onClose(); onNavigatePremium(); } },
        ]
      );
      return;
    }
    setCreatingNew(true);
  }

  const dividerColor = mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';

  return (
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
          <View style={styles.header}>
            <TouchableOpacity
              onPress={onClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={[styles.pillBtn, { backgroundColor: colors.surfaceSecondary }]}
            >
              <Text style={[styles.pillBtnText, { color: colors.textSecondary }]} maxFontSizeMultiplier={1.1}>
                {t('common.done')}
              </Text>
            </TouchableOpacity>

            <Text style={[styles.title, { color: colors.text }]} numberOfLines={1} maxFontSizeMultiplier={1.2}>
              {t('matrices.title')}
            </Text>

            <TouchableOpacity
              onPress={handleNewMatrixPress}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={[styles.pillBtn, { backgroundColor: colors.primary }]}
            >
              <Ionicons name="add" size={14} color="#FFFFFF" />
              <Text style={[styles.pillBtnText, { color: '#FFFFFF' }]} maxFontSizeMultiplier={1.1}>
                {t('matrices.newMatrix')}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Hint */}
          {matrices.length > 1 && (
            <Text style={[styles.hint, { color: colors.textTertiary }]} maxFontSizeMultiplier={1.1}>
              {t('matrices.longPressHint')}
            </Text>
          )}

          <ScrollView
            ref={scrollRef}
            style={styles.list}
            contentContainerStyle={styles.listContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {matrices.map((matrix, idx) => {
              const isSelected = matrix.id === currentMatrixId;
              const isRenaming = renamingId === matrix.id;

              return (
                <View key={matrix.id}>
                  {idx > 0 && <View style={[styles.divider, { backgroundColor: dividerColor }]} />}
                  <TouchableOpacity
                    style={styles.row}
                    onPress={() => {
                      if (!isRenaming) handleSelectMatrix(matrix.id);
                    }}
                    onLongPress={() => handleLongPress(matrix)}
                    activeOpacity={0.6}
                    delayLongPress={400}
                  >
                    {isRenaming ? (
                      <View style={styles.renameRow}>
                        <TextInput
                          ref={renameInputRef}
                          style={[
                            styles.renameInput,
                            {
                              color: colors.text,
                              borderBottomColor: colors.primary,
                              backgroundColor: colors.surfaceSecondary,
                            },
                          ]}
                          value={renameValue}
                          onChangeText={setRenameValue}
                          maxLength={40}
                          returnKeyType="done"
                          onSubmitEditing={handleRenameConfirm}
                          maxFontSizeMultiplier={1.2}
                        />
                        <TouchableOpacity
                          onPress={handleRenameConfirm}
                          disabled={!renameValue.trim()}
                          style={[
                            styles.renameConfirmBtn,
                            { backgroundColor: renameValue.trim() ? colors.primary : colors.border },
                          ]}
                        >
                          <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => { setRenamingId(null); setRenameValue(''); }}
                          style={[styles.renameConfirmBtn, { backgroundColor: colors.surfaceSecondary }]}
                        >
                          <Ionicons name="close" size={16} color={colors.textSecondary} />
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <>
                        <View style={[styles.matrixIcon, { backgroundColor: colors.primary + '18' }]}>
                          <Ionicons name="grid-outline" size={16} color={colors.primary} />
                        </View>
                        <Text
                          style={[styles.matrixName, { color: colors.text }]}
                          numberOfLines={1}
                          maxFontSizeMultiplier={1.2}
                        >
                          {matrix.name}
                        </Text>
                        {isSelected && (
                          <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                        )}
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              );
            })}

            {/* Inline new matrix input */}
            {creatingNew && (
              <View>
                <View style={[styles.divider, { backgroundColor: dividerColor }]} />
                <View style={styles.newRow}>
                  <View style={[styles.matrixIcon, { backgroundColor: colors.primary + '18' }]}>
                    <Ionicons name="add-circle-outline" size={16} color={colors.primary} />
                  </View>
                  <TextInput
                    ref={newInputRef}
                    style={[
                      styles.newInput,
                      {
                        color: colors.text,
                        borderBottomColor: colors.primary,
                      },
                    ]}
                    placeholder={t('matrices.namePlaceholder')}
                    placeholderTextColor={colors.textTertiary}
                    value={newName}
                    onChangeText={setNewName}
                    maxLength={40}
                    returnKeyType="done"
                    onSubmitEditing={handleCreateNew}
                    maxFontSizeMultiplier={1.2}
                  />
                  <TouchableOpacity
                    onPress={handleCreateNew}
                    disabled={!newName.trim()}
                    style={[
                      styles.renameConfirmBtn,
                      { backgroundColor: newName.trim() ? colors.primary : colors.border },
                    ]}
                  >
                    <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => { setCreatingNew(false); setNewName(''); }}
                    style={[styles.renameConfirmBtn, { backgroundColor: colors.surfaceSecondary }]}
                  >
                    <Ionicons name="close" size={16} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </ScrollView>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, justifyContent: 'flex-end' },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheet: {
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    paddingBottom: Platform.OS === 'ios' ? 34 : Spacing.lg,
    maxHeight: '80%',
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    gap: Spacing.xs,
  },
  title: {
    ...Typography.subheadSemi,
    flex: 1,
    textAlign: 'center',
  },
  pillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    minHeight: 34,
  },
  pillBtnText: { ...Typography.footnote, fontWeight: '600' },
  hint: {
    ...Typography.caption2,
    textAlign: 'center',
    marginBottom: Spacing.xs,
    paddingHorizontal: Spacing.lg,
  },
  list: { flexGrow: 0 },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    paddingTop: Spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.md,
    minHeight: MIN_TOUCH_TARGET,
  },
  matrixIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  matrixName: {
    ...Typography.callout,
    flex: 1,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
  },
  renameRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  renameInput: {
    ...Typography.callout,
    flex: 1,
    borderBottomWidth: 2,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
  },
  renameConfirmBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  newRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.md,
    minHeight: MIN_TOUCH_TARGET,
  },
  newInput: {
    ...Typography.callout,
    flex: 1,
    borderBottomWidth: 2,
    paddingVertical: Spacing.xs,
  },
});
