import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SectionList,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/theme/Theme';
import { TaskCard } from '@/components/matrix/TaskCard';
import { TaskModal } from '@/components/tasks/TaskModal';
import { EmptyState } from '@/components/ui/EmptyState';
import { BannerAd } from '@/ads/BannerAd';
import { useTaskStore } from '@/store/taskStore';
import { useSettingsStore } from '@/store/settingsStore';
import { Spacing, Radius, Typography, Shadow, MIN_TOUCH_TARGET } from '@/theme/spacing';
import { QUADRANT_IDS } from '@/utils/quadrants';
import { t } from '@/i18n';
import type { Task, QuadrantId } from '@/types';
import type { SortBy } from '@/store/settingsStore';

const SORT_OPTIONS: { key: SortBy; icon: string }[] = [
  { key: 'default', icon: 'list-outline' },
  { key: 'dueDate', icon: 'calendar-outline' },
  { key: 'alpha', icon: 'text-outline' },
];

function sortTasks(tasks: Task[], sortBy: SortBy): Task[] {
  if (sortBy === 'dueDate') {
    return [...tasks].sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      if (!a.dueDate && !b.dueDate) return (a.order ?? 0) - (b.order ?? 0);
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return a.dueDate - b.dueDate;
    });
  }
  if (sortBy === 'alpha') {
    return [...tasks].sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      return a.title.localeCompare(b.title);
    });
  }
  // default
  return [...tasks].sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    return (a.order ?? 0) - (b.order ?? 0);
  });
}

export function ListScreen() {
  const { colors, mode, getQuadrantStyle } = useTheme();
  const getTasksByQuadrant = useTaskStore((s) => s.getTasksByQuadrant);
  const showCompleted = useSettingsStore((s) => s.showCompleted);
  const toggleShowCompleted = useSettingsStore((s) => s.toggleShowCompleted);
  const sortBy = useSettingsStore((s) => s.sortBy);
  const setSortBy = useSettingsStore((s) => s.setSortBy);

  const allTasks = useTaskStore((s) => s.tasks);
  const currentMatrixId = useTaskStore((s) => s.currentMatrixId);

  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [addingToQuadrant, setAddingToQuadrant] = useState<QuadrantId | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    allTasks
      .filter((tk) => tk.matrixId === currentMatrixId)
      .forEach((tk) => tk.tags?.forEach((tag) => tagSet.add(tag)));
    return Array.from(tagSet).sort();
  }, [allTasks, currentMatrixId]);

  const sections = useMemo(() => {
    return QUADRANT_IDS.map((id) => {
      let tasks = getTasksByQuadrant(id);
      if (!showCompleted) tasks = tasks.filter((tk) => !tk.completed);
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        tasks = tasks.filter(
          (tk) =>
            tk.title.toLowerCase().includes(q) ||
            (tk.description ?? '').toLowerCase().includes(q)
        );
      }
      if (selectedTag) {
        tasks = tasks.filter((tk) => tk.tags?.includes(selectedTag));
      }
      tasks = sortTasks(tasks, sortBy);
      return { id, data: tasks };
    }).filter((s) => s.data.length > 0);
  }, [getTasksByQuadrant, showCompleted, searchQuery, selectedTag, sortBy]);

  const totalActive = QUADRANT_IDS.reduce(
    (acc, id) => acc + getTasksByQuadrant(id).filter((tk) => !tk.completed).length,
    0
  );

  const hasSearchResults = searchQuery.trim() && sections.length === 0;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View
        style={[
          styles.header,
          { borderBottomColor: colors.borderLight },
          mode === 'light' && { backgroundColor: colors.surface, ...Shadow.sm },
        ]}
      >
        <View style={styles.headerLeft}>
          <Text
            style={[styles.title, { color: colors.text }]}
            numberOfLines={1}
            maxFontSizeMultiplier={1.2}
          >
            {t('list.title')}
          </Text>
          <Text
            style={[styles.subtitle, { color: colors.textSecondary }]}
            numberOfLines={1}
            maxFontSizeMultiplier={1.2}
          >
            {t('list.active', { count: totalActive })}
          </Text>
        </View>

        {/* Sort button */}
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={[
              styles.actionBtn,
              {
                backgroundColor: colors.surfaceSecondary,
                borderColor: colors.border,
              },
            ]}
            onPress={() => {
              Haptics.selectionAsync();
              setShowSortMenu((v) => !v);
            }}
          >
            <Ionicons
              name={SORT_OPTIONS.find((o) => o.key === sortBy)?.icon as any ?? 'list-outline'}
              size={14}
              color={colors.textSecondary}
            />
          </TouchableOpacity>

          {/* Show/hide done */}
          <TouchableOpacity
            style={[
              styles.filterBtn,
              {
                backgroundColor: showCompleted ? colors.surfaceSecondary : colors.surface,
                borderColor: colors.border,
              },
            ]}
            onPress={() => {
              Haptics.selectionAsync();
              toggleShowCompleted();
            }}
          >
            <Ionicons
              name={showCompleted ? 'eye' : 'eye-off-outline'}
              size={14}
              color={colors.textSecondary}
            />
            <Text
              style={[styles.filterText, { color: colors.textSecondary }]}
              maxFontSizeMultiplier={1.1}
            >
              {showCompleted ? t('list.hideDone') : t('list.showDone')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Sort menu dropdown */}
      {showSortMenu && (
        <View
          style={[
            styles.sortMenu,
            { backgroundColor: colors.surface, borderColor: colors.border },
            Shadow.md,
          ]}
        >
          {SORT_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.key}
              style={[
                styles.sortMenuItem,
                sortBy === opt.key && { backgroundColor: colors.surfaceSecondary },
              ]}
              onPress={() => {
                Haptics.selectionAsync();
                setSortBy(opt.key);
                setShowSortMenu(false);
              }}
            >
              <Ionicons
                name={opt.icon as any}
                size={15}
                color={sortBy === opt.key ? colors.primary : colors.textSecondary}
              />
              <Text
                style={[
                  styles.sortMenuText,
                  { color: sortBy === opt.key ? colors.primary : colors.text },
                ]}
                maxFontSizeMultiplier={1.1}
              >
                {t(`settings.sort${opt.key.charAt(0).toUpperCase() + opt.key.slice(1)}` as any)}
              </Text>
              {sortBy === opt.key && (
                <Ionicons name="checkmark" size={14} color={colors.primary} style={{ marginLeft: 'auto' }} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Search bar */}
      <View style={[styles.searchContainer, { backgroundColor: colors.background }]}>
        <View
          style={[
            styles.searchBar,
            { backgroundColor: colors.surfaceSecondary, borderColor: colors.borderLight },
          ]}
        >
          <Ionicons name="search-outline" size={16} color={colors.textTertiary} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder={t('list.search')}
            placeholderTextColor={colors.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
            clearButtonMode="while-editing"
            maxFontSizeMultiplier={1.2}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="close-circle" size={16} color={colors.textTertiary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Tag filter bar */}
      {allTags.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tagBar}
          keyboardShouldPersistTaps="handled"
        >
          <TouchableOpacity
            style={[
              styles.tagChip,
              !selectedTag
                ? { backgroundColor: colors.primary }
                : { backgroundColor: colors.surfaceSecondary, borderColor: colors.border },
            ]}
            onPress={() => {
              Haptics.selectionAsync();
              setSelectedTag(null);
            }}
          >
            <Text style={[styles.tagChipText, { color: !selectedTag ? '#fff' : colors.textSecondary }]}>
              Tous
            </Text>
          </TouchableOpacity>
          {allTags.map((tag) => (
            <TouchableOpacity
              key={tag}
              style={[
                styles.tagChip,
                selectedTag === tag
                  ? { backgroundColor: colors.primary }
                  : { backgroundColor: colors.surfaceSecondary, borderColor: colors.border },
              ]}
              onPress={() => {
                Haptics.selectionAsync();
                setSelectedTag(selectedTag === tag ? null : tag);
              }}
            >
              <Text style={[styles.tagChipText, { color: selectedTag === tag ? '#fff' : colors.textSecondary }]}>
                {tag}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {hasSearchResults ? (
        <View style={styles.emptyContainer}>
          <EmptyState
            icon="search-outline"
            title={t('list.noResults')}
            subtitle={t('list.noResultsSub')}
            color={colors.textTertiary}
          />
        </View>
      ) : sections.length === 0 ? (
        <View style={styles.emptyContainer}>
          <EmptyState
            icon="checkmark-done-circle-outline"
            title={t('list.allClear')}
            subtitle={t('list.allClearSub')}
            color={colors.textTertiary}
          />
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          renderSectionHeader={({ section }) => {
            const style = getQuadrantStyle(section.id as QuadrantId);
            return (
              <View style={styles.sectionHeader}>
                <View style={[styles.sectionDot, { backgroundColor: style.accent }]} />
                <Text
                  style={[styles.sectionTitle, { color: colors.text }]}
                  maxFontSizeMultiplier={1.2}
                >
                  {t(`quadrants.${section.id}.label`)}
                </Text>
                <Text
                  style={[styles.sectionCount, { color: colors.textTertiary }]}
                  maxFontSizeMultiplier={1.1}
                >
                  {section.data.length}
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setAddingToQuadrant(section.id as QuadrantId);
                  }}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="add-circle-outline" size={22} color={style.accent} />
                </TouchableOpacity>
              </View>
            );
          }}
          renderItem={({ item }) => {
            return (
              <View style={[styles.cardWrapper, { backgroundColor: colors.surface }]}>
                <TaskCard task={item} accentColor={getQuadrantStyle(item.quadrant).accent} onPress={setEditingTask} />
              </View>
            );
          }}
          SectionSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
        />
      )}

      <BannerAd />

      <TaskModal
        visible={!!editingTask || !!addingToQuadrant}
        task={editingTask}
        defaultQuadrant={addingToQuadrant ?? editingTask?.quadrant ?? 'q1'}
        onClose={() => {
          setEditingTask(null);
          setAddingToQuadrant(null);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: Spacing.sm,
  },
  headerLeft: { flex: 1, minWidth: 0 },
  headerActions: { flexDirection: 'row', gap: Spacing.xs, alignItems: 'center', flexShrink: 0 },
  title: { ...Typography.title1 },
  subtitle: { ...Typography.footnote, marginTop: 2 },
  actionBtn: {
    width: 34,
    height: 34,
    borderRadius: Radius.sm,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: Radius.full,
    borderWidth: StyleSheet.hairlineWidth,
    minHeight: 32,
  },
  filterText: { ...Typography.caption1, fontWeight: '500' },
  sortMenu: {
    position: 'absolute',
    top: 96,
    right: Spacing.lg,
    zIndex: 100,
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    minWidth: 180,
    overflow: 'hidden',
  },
  sortMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    minHeight: MIN_TOUCH_TARGET,
  },
  sortMenuText: { ...Typography.callout, flex: 1 },
  searchContainer: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    height: 38,
  },
  searchInput: {
    flex: 1,
    ...Typography.callout,
    paddingVertical: 0,
  },
  listContent: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xxl },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    marginTop: Spacing.md,
  },
  sectionDot: { width: 8, height: 8, borderRadius: 4 },
  sectionTitle: { flex: 1, ...Typography.subheadSemi },
  sectionCount: { ...Typography.footnote },
  cardWrapper: {
    borderRadius: Radius.sm,
    overflow: 'hidden',
    marginBottom: 2,
  },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  tagBar: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.sm,
    gap: Spacing.xs,
    flexDirection: 'row',
  },
  tagChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 5,
    borderRadius: Radius.full,
    borderWidth: StyleSheet.hairlineWidth,
  },
  tagChipText: { ...Typography.caption1, fontWeight: '500' },
});
