import WidgetKit
import SwiftUI

// MARK: - Data

struct WidgetTask: Codable, Identifiable {
  let id: String
  let title: String
}

struct WidgetData: Codable {
  let q1: [WidgetTask]
  let q2: [WidgetTask]
  let q3: [WidgetTask]
  let q4: [WidgetTask]
}

struct EisenhowerEntry: TimelineEntry {
  let date: Date
  let data: WidgetData
}

// MARK: - Data loading

private let APP_GROUP = "group.com.darchevert.eisenhower"

private func loadWidgetData() -> WidgetData {
  if let defaults = UserDefaults(suiteName: APP_GROUP),
     let json = defaults.string(forKey: "widget_data"),
     let raw = json.data(using: .utf8),
     let parsed = try? JSONDecoder().decode(WidgetData.self, from: raw) {
    return parsed
  }
  if let defaults = UserDefaults(suiteName: APP_GROUP),
     let json = defaults.string(forKey: "widget_tasks"),
     let raw = json.data(using: .utf8),
     let tasks = try? JSONDecoder().decode([WidgetTask].self, from: raw) {
    return WidgetData(q1: tasks, q2: [], q3: [], q4: [])
  }
  return WidgetData(q1: [], q2: [], q3: [], q4: [])
}

private func placeholderData() -> WidgetData {
  WidgetData(
    q1: [WidgetTask(id: "1", title: "Prepare quarterly report"),
         WidgetTask(id: "2", title: "Fix critical bug")],
    q2: [WidgetTask(id: "3", title: "Learn SwiftUI"),
         WidgetTask(id: "4", title: "Exercise plan")],
    q3: [WidgetTask(id: "5", title: "Reply to emails"),
         WidgetTask(id: "6", title: "Book meeting room")],
    q4: [WidgetTask(id: "7", title: "Old newsletter"),
         WidgetTask(id: "8", title: "Junk folder")]
  )
}

// MARK: - Provider

struct EisenhowerProvider: TimelineProvider {
  func placeholder(in context: Context) -> EisenhowerEntry {
    EisenhowerEntry(date: Date(), data: placeholderData())
  }
  func getSnapshot(in context: Context, completion: @escaping (EisenhowerEntry) -> Void) {
    completion(EisenhowerEntry(date: Date(), data: loadWidgetData()))
  }
  func getTimeline(in context: Context, completion: @escaping (Timeline<EisenhowerEntry>) -> Void) {
    let entry = EisenhowerEntry(date: Date(), data: loadWidgetData())
    let next = Calendar.current.date(byAdding: .hour, value: 1, to: Date())!
    completion(Timeline(entries: [entry], policy: .after(next)))
  }
}

// MARK: - Adaptive colors (auto dark/light)

private let bgAdaptive = Color(UIColor { t in
  t.userInterfaceStyle == .dark
    ? UIColor(red: 0.059, green: 0.090, blue: 0.165, alpha: 1)
    : UIColor(red: 0.965, green: 0.969, blue: 0.980, alpha: 1)
})
private let textPrimaryAdaptive = Color(UIColor { t in
  t.userInterfaceStyle == .dark
    ? UIColor(red: 0.886, green: 0.914, blue: 0.941, alpha: 1)
    : UIColor(red: 0.102, green: 0.137, blue: 0.216, alpha: 1)
})
private let textSecondaryAdaptive = Color(UIColor { t in
  t.userInterfaceStyle == .dark
    ? UIColor(red: 0.392, green: 0.455, blue: 0.533, alpha: 1)
    : UIColor(red: 0.431, green: 0.490, blue: 0.573, alpha: 1)
})
private let dividerAdaptive = Color(UIColor { t in
  t.userInterfaceStyle == .dark
    ? UIColor(red: 0.118, green: 0.161, blue: 0.235, alpha: 1)
    : UIColor(red: 0.839, green: 0.859, blue: 0.898, alpha: 1)
})

// MARK: - Quadrant accent colors

private let q1Color = Color(red: 0.937, green: 0.267, blue: 0.267)
private let q2Color = Color(red: 0.133, green: 0.773, blue: 0.369)
private let q3Color = Color(red: 0.961, green: 0.620, blue: 0.043)
private let q4Color = Color(red: 0.392, green: 0.455, blue: 0.533)

// MARK: - QuadrantListView (per-quadrant widgets Q1–Q4)

struct QuadrantListView: View {
  let tasks: [WidgetTask]
  let accentColor: Color
  let label: String
  let iconName: String
  @Environment(\.widgetFamily) var family

  private var maxTasks: Int { family == .systemSmall ? 2 : 5 }

  var body: some View {
    VStack(alignment: .leading, spacing: 4) {
      HStack(spacing: 5) {
        Circle().fill(accentColor).frame(width: 7, height: 7)
        Text(label).font(.system(size: 12, weight: .bold)).foregroundColor(accentColor)
        Spacer()
        Image(systemName: iconName).font(.system(size: 11)).foregroundColor(textSecondaryAdaptive)
      }
      Rectangle().fill(accentColor.opacity(0.25)).frame(height: 1).padding(.vertical, 1)
      if tasks.isEmpty {
        Spacer()
        Text("No tasks").font(.system(size: 12)).foregroundColor(textSecondaryAdaptive).italic()
        Spacer()
      } else {
        ForEach(Array(tasks.prefix(maxTasks))) { task in
          HStack(alignment: .top, spacing: 5) {
            Circle().fill(textSecondaryAdaptive.opacity(0.5)).frame(width: 5, height: 5).padding(.top, 4)
            Text(task.title).font(.system(size: 12)).foregroundColor(textPrimaryAdaptive).lineLimit(1)
          }
        }
        Spacer(minLength: 0)
      }
    }
    .padding(12)
    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
    .background(bgAdaptive)
  }
}

// MARK: - Q1

struct Q1EntryView: View {
  var entry: EisenhowerEntry
  var body: some View {
    QuadrantListView(tasks: entry.data.q1, accentColor: q1Color, label: "Do First", iconName: "exclamationmark.circle.fill")
  }
}

struct Q1Widget: Widget {
  let kind = "EisenhowerWidget"
  var body: some WidgetConfiguration {
    StaticConfiguration(kind: kind, provider: EisenhowerProvider()) { entry in
      if #available(iOS 17.0, *) {
        Q1EntryView(entry: entry).containerBackground(bgAdaptive, for: .widget)
      } else {
        Q1EntryView(entry: entry)
      }
    }
    .configurationDisplayName("Do First")
    .description("Urgent & important tasks.")
    .supportedFamilies([.systemSmall, .systemMedium])
  }
}

// MARK: - Q2

struct Q2EntryView: View {
  var entry: EisenhowerEntry
  var body: some View {
    QuadrantListView(tasks: entry.data.q2, accentColor: q2Color, label: "Schedule", iconName: "calendar")
  }
}

struct Q2Widget: Widget {
  let kind = "EisenhowerQ2"
  var body: some WidgetConfiguration {
    StaticConfiguration(kind: kind, provider: EisenhowerProvider()) { entry in
      if #available(iOS 17.0, *) {
        Q2EntryView(entry: entry).containerBackground(bgAdaptive, for: .widget)
      } else {
        Q2EntryView(entry: entry)
      }
    }
    .configurationDisplayName("Schedule")
    .description("Important but not urgent tasks.")
    .supportedFamilies([.systemSmall, .systemMedium])
  }
}

// MARK: - Q3

struct Q3EntryView: View {
  var entry: EisenhowerEntry
  var body: some View {
    QuadrantListView(tasks: entry.data.q3, accentColor: q3Color, label: "Delegate", iconName: "arrow.turn.up.right")
  }
}

struct Q3Widget: Widget {
  let kind = "EisenhowerQ3"
  var body: some WidgetConfiguration {
    StaticConfiguration(kind: kind, provider: EisenhowerProvider()) { entry in
      if #available(iOS 17.0, *) {
        Q3EntryView(entry: entry).containerBackground(bgAdaptive, for: .widget)
      } else {
        Q3EntryView(entry: entry)
      }
    }
    .configurationDisplayName("Delegate")
    .description("Urgent but not important tasks.")
    .supportedFamilies([.systemSmall, .systemMedium])
  }
}

// MARK: - Q4

struct Q4EntryView: View {
  var entry: EisenhowerEntry
  var body: some View {
    QuadrantListView(tasks: entry.data.q4, accentColor: q4Color, label: "Eliminate", iconName: "trash")
  }
}

struct Q4Widget: Widget {
  let kind = "EisenhowerQ4"
  var body: some WidgetConfiguration {
    StaticConfiguration(kind: kind, provider: EisenhowerProvider()) { entry in
      if #available(iOS 17.0, *) {
        Q4EntryView(entry: entry).containerBackground(bgAdaptive, for: .widget)
      } else {
        Q4EntryView(entry: entry)
      }
    }
    .configurationDisplayName("Eliminate")
    .description("Neither urgent nor important tasks.")
    .supportedFamilies([.systemSmall, .systemMedium])
  }
}

// MARK: - QuadrantCellView (Matrix 2x2 cell)

struct QuadrantCellView: View {
  let tasks: [WidgetTask]
  let color: Color
  let label: String
  let maxTasks: Int

  var body: some View {
    VStack(alignment: .leading, spacing: 3) {
      HStack(spacing: 4) {
        Circle().fill(color).frame(width: 5, height: 5)
        Text(label).font(.system(size: 10, weight: .bold)).foregroundColor(color).lineLimit(1)
      }
      Rectangle().fill(color.opacity(0.2)).frame(height: 1).padding(.bottom, 1)
      if tasks.isEmpty {
        Text("—").font(.system(size: 10)).foregroundColor(textSecondaryAdaptive)
      } else {
        ForEach(Array(tasks.prefix(maxTasks))) { task in
          Text(task.title).font(.system(size: 10)).foregroundColor(textPrimaryAdaptive).lineLimit(1)
        }
      }
      Spacer(minLength: 0)
    }
    .padding(8)
    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
  }
}

// MARK: - Matrix 2x2

struct MatrixEntryView: View {
  var entry: EisenhowerEntry
  @Environment(\.widgetFamily) var family

  private var maxPerQuadrant: Int { family == .systemLarge ? 3 : 2 }

  var body: some View {
    VStack(spacing: 0) {
      HStack(spacing: 0) {
        QuadrantCellView(tasks: entry.data.q1, color: q1Color, label: "Do First",  maxTasks: maxPerQuadrant)
        dividerAdaptive.frame(width: 1)
        QuadrantCellView(tasks: entry.data.q2, color: q2Color, label: "Schedule",  maxTasks: maxPerQuadrant)
      }
      dividerAdaptive.frame(height: 1)
      HStack(spacing: 0) {
        QuadrantCellView(tasks: entry.data.q3, color: q3Color, label: "Delegate",  maxTasks: maxPerQuadrant)
        dividerAdaptive.frame(width: 1)
        QuadrantCellView(tasks: entry.data.q4, color: q4Color, label: "Eliminate", maxTasks: maxPerQuadrant)
      }
    }
    .background(bgAdaptive)
  }
}

struct MatrixWidget: Widget {
  let kind = "EisenhowerMatrix"
  var body: some WidgetConfiguration {
    StaticConfiguration(kind: kind, provider: EisenhowerProvider()) { entry in
      if #available(iOS 17.0, *) {
        MatrixEntryView(entry: entry).containerBackground(bgAdaptive, for: .widget)
      } else {
        MatrixEntryView(entry: entry)
      }
    }
    .configurationDisplayName("Eisenhower Matrix")
    .description("All four quadrants at a glance.")
    .supportedFamilies([.systemMedium, .systemLarge])
  }
}

// MARK: - CountDot helper

private struct CountDot: View {
  let color: Color
  let count: Int
  var body: some View {
    HStack(spacing: 2) {
      Circle().fill(color).frame(width: 5, height: 5)
      Text("\(count)").font(.system(size: 9, weight: .semibold)).foregroundColor(color)
    }
  }
}

// MARK: - Task Dashboard (flat task list with quadrant count header)

struct TaskDashboardEntryView: View {
  var entry: EisenhowerEntry
  @Environment(\.widgetFamily) var family

  private struct TaskItem: Identifiable {
    let id: String; let title: String; let color: Color
  }
  private var allTasks: [TaskItem] {
    entry.data.q1.map { TaskItem(id: $0.id, title: $0.title, color: q1Color) } +
    entry.data.q2.map { TaskItem(id: $0.id, title: $0.title, color: q2Color) } +
    entry.data.q3.map { TaskItem(id: $0.id, title: $0.title, color: q3Color) } +
    entry.data.q4.map { TaskItem(id: $0.id, title: $0.title, color: q4Color) }
  }
  private var maxVisible: Int { family == .systemSmall ? 3 : 6 }

  var body: some View {
    let all = allTasks
    let visible = Array(all.prefix(maxVisible))
    let overflow = all.count - visible.count

    VStack(alignment: .leading, spacing: 4) {
      HStack(spacing: 4) {
        Text("À faire").font(.system(size: 12, weight: .bold)).foregroundColor(textPrimaryAdaptive)
        Spacer()
        CountDot(color: q1Color, count: entry.data.q1.count)
        CountDot(color: q2Color, count: entry.data.q2.count)
        CountDot(color: q3Color, count: entry.data.q3.count)
        CountDot(color: q4Color, count: entry.data.q4.count)
      }
      Rectangle().fill(dividerAdaptive).frame(height: 1)
      if all.isEmpty {
        Spacer()
        Text("No tasks").font(.system(size: 12)).foregroundColor(textSecondaryAdaptive).italic()
        Spacer()
      } else {
        ForEach(visible) { item in
          HStack(alignment: .top, spacing: 6) {
            Circle().fill(item.color).frame(width: 6, height: 6).padding(.top, 3)
            Text(item.title).font(.system(size: 12)).foregroundColor(textPrimaryAdaptive).lineLimit(1)
          }
        }
        if overflow > 0 {
          Text("+\(overflow) de plus").font(.system(size: 10)).foregroundColor(textSecondaryAdaptive).padding(.top, 1)
        }
        Spacer(minLength: 0)
      }
    }
    .padding(12)
    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
    .background(bgAdaptive)
  }
}

struct TaskDashboardWidget: Widget {
  let kind = "EisenhowerDashboard"
  var body: some WidgetConfiguration {
    StaticConfiguration(kind: kind, provider: EisenhowerProvider()) { entry in
      if #available(iOS 17.0, *) {
        TaskDashboardEntryView(entry: entry).containerBackground(bgAdaptive, for: .widget)
      } else {
        TaskDashboardEntryView(entry: entry)
      }
    }
    .configurationDisplayName("Task Dashboard")
    .description("All tasks with quadrant counts.")
    .supportedFamilies([.systemSmall, .systemMedium])
  }
}

// MARK: - Double Section (Q1 + Q2 side by side)

struct DoubleSectionEntryView: View {
  var entry: EisenhowerEntry
  var body: some View {
    HStack(spacing: 0) {
      QuadrantListView(tasks: entry.data.q1, accentColor: q1Color, label: "Do First", iconName: "exclamationmark.circle.fill")
      dividerAdaptive.frame(width: 1)
      QuadrantListView(tasks: entry.data.q2, accentColor: q2Color, label: "Schedule", iconName: "calendar")
    }
    .background(bgAdaptive)
  }
}

struct DoubleSectionWidget: Widget {
  let kind = "EisenhowerDouble"
  var body: some WidgetConfiguration {
    StaticConfiguration(kind: kind, provider: EisenhowerProvider()) { entry in
      if #available(iOS 17.0, *) {
        DoubleSectionEntryView(entry: entry).containerBackground(bgAdaptive, for: .widget)
      } else {
        DoubleSectionEntryView(entry: entry)
      }
    }
    .configurationDisplayName("Double Section")
    .description("Do First and Schedule side by side.")
    .supportedFamilies([.systemMedium])
  }
}

// MARK: - Date & Tasks

private let monthFormatter: DateFormatter = {
  let f = DateFormatter(); f.dateFormat = "MMM"; return f
}()
private let weekdayFormatter: DateFormatter = {
  let f = DateFormatter(); f.dateFormat = "EEEE"; return f
}()
private let monthYearFormatter: DateFormatter = {
  let f = DateFormatter(); f.dateFormat = "MMMM yyyy"; return f
}()

struct DateTasksEntryView: View {
  var entry: EisenhowerEntry
  @Environment(\.widgetFamily) var family

  private struct QDef { let tasks: [WidgetTask]; let label: String; let color: Color }
  private func quadrants(_ data: WidgetData) -> [QDef] { [
    QDef(tasks: data.q1, label: "Do First",  color: q1Color),
    QDef(tasks: data.q2, label: "Schedule",  color: q2Color),
    QDef(tasks: data.q3, label: "Delegate",  color: q3Color),
    QDef(tasks: data.q4, label: "Eliminate", color: q4Color),
  ] }

  var body: some View {
    let qs = quadrants(entry.data)
    let dayNum = Calendar.current.component(.day, from: entry.date)
    let month = monthFormatter.string(from: entry.date).uppercased()
    let weekday = weekdayFormatter.string(from: entry.date)
    let maxPerQ = family == .systemLarge ? 2 : 1

    HStack(spacing: 0) {
      VStack(alignment: .leading, spacing: 2) {
        Text(month).font(.system(size: 10, weight: .semibold)).foregroundColor(textSecondaryAdaptive)
        Text("\(dayNum)").font(.system(size: 32, weight: .bold)).foregroundColor(textPrimaryAdaptive).lineLimit(1)
        Text(weekday).font(.system(size: 10)).foregroundColor(q2Color).lineLimit(2)
        Spacer()
      }
      .padding(12)
      .frame(width: 72, maxHeight: .infinity, alignment: .topLeading)

      dividerAdaptive.frame(width: 1)

      VStack(alignment: .leading, spacing: 5) {
        ForEach(0..<qs.count, id: \.self) { i in
          let q = qs[i]
          if !q.tasks.isEmpty {
            VStack(alignment: .leading, spacing: 2) {
              HStack(spacing: 4) {
                Circle().fill(q.color).frame(width: 5, height: 5)
                Text(q.label).font(.system(size: 9, weight: .bold)).foregroundColor(q.color)
                Spacer()
                Text("\(q.tasks.count)").font(.system(size: 9, weight: .semibold)).foregroundColor(q.color)
              }
              ForEach(Array(q.tasks.prefix(maxPerQ))) { task in
                Text("· \(task.title)")
                  .font(.system(size: 10))
                  .foregroundColor(textPrimaryAdaptive)
                  .lineLimit(1)
                  .padding(.leading, 9)
              }
            }
          }
        }
        Spacer(minLength: 0)
      }
      .padding(10)
      .frame(maxHeight: .infinity, alignment: .topLeading)
    }
    .background(bgAdaptive)
  }
}

struct DateTasksWidget: Widget {
  let kind = "EisenhowerDateTasks"
  var body: some WidgetConfiguration {
    StaticConfiguration(kind: kind, provider: EisenhowerProvider()) { entry in
      if #available(iOS 17.0, *) {
        DateTasksEntryView(entry: entry).containerBackground(bgAdaptive, for: .widget)
      } else {
        DateTasksEntryView(entry: entry)
      }
    }
    .configurationDisplayName("Date & Tasks")
    .description("Today's date with tasks by quadrant.")
    .supportedFamilies([.systemMedium, .systemLarge])
  }
}

// MARK: - Mini Calendar Grid

private struct MiniCalendarView: View {
  let date: Date

  private let cal = Calendar.current
  private let dayLetters = ["D", "L", "M", "M", "J", "V", "S"]

  private var monthLabel: String { monthYearFormatter.string(from: date) }
  private var today: Int { cal.component(.day, from: date) }

  private var days: [Int?] {
    var components = cal.dateComponents([.year, .month], from: date)
    components.day = 1
    guard let firstDay = cal.date(from: components) else { return [] }
    let weekday = cal.component(.weekday, from: firstDay) - 1 // 0=Sun
    let range = cal.range(of: .day, in: .month, for: date)!
    var result: [Int?] = Array(repeating: nil, count: weekday)
    result += (1...range.count).map { Optional($0) }
    return result
  }

  var body: some View {
    VStack(alignment: .leading, spacing: 3) {
      Text(monthLabel)
        .font(.system(size: 9, weight: .semibold))
        .foregroundColor(textSecondaryAdaptive)

      // Day-of-week header
      HStack(spacing: 0) {
        ForEach(dayLetters, id: \.self) { letter in
          Text(letter)
            .font(.system(size: 8, weight: .medium))
            .foregroundColor(textSecondaryAdaptive)
            .frame(maxWidth: .infinity)
        }
      }

      // Day grid
      let rows = days.chunks(of: 7)
      ForEach(0..<rows.count, id: \.self) { r in
        HStack(spacing: 0) {
          ForEach(0..<7, id: \.self) { c in
            let idx = r * 7 + c
            let day = idx < days.count ? days[idx] : nil
            ZStack {
              if let d = day, d == today {
                Circle().fill(q2Color).frame(width: 14, height: 14)
              }
              Text(day.map { "\($0)" } ?? "")
                .font(.system(size: 8))
                .foregroundColor(day == today ? Color.white : textPrimaryAdaptive)
            }
            .frame(maxWidth: .infinity)
          }
        }
      }
    }
  }
}

private extension Array {
  func chunks(of size: Int) -> [[Element]] {
    stride(from: 0, to: count, by: size).map {
      Array(self[$0..<Swift.min($0 + size, count)])
    }
  }
}

// MARK: - Calendar & Tasks widget

struct CalendarTasksEntryView: View {
  var entry: EisenhowerEntry
  @Environment(\.widgetFamily) var family

  private struct QDef { let tasks: [WidgetTask]; let label: String; let color: Color; let icon: String }
  private func quadrants(_ data: WidgetData) -> [QDef] { [
    QDef(tasks: data.q1, label: "Important & Urgent",     color: q1Color, icon: "🔴"),
    QDef(tasks: data.q2, label: "Important & Non urgent", color: q2Color, icon: "📅"),
    QDef(tasks: data.q3, label: "Urgent & Moins important", color: q3Color, icon: "⚡"),
    QDef(tasks: data.q4, label: "Non urgent & moins important", color: q4Color, icon: "☰"),
  ] }

  private var maxPerQ: Int { family == .systemLarge ? 2 : 1 }

  var body: some View {
    let qs = quadrants(entry.data)
    HStack(spacing: 0) {
      // Left: mini calendar
      VStack(alignment: .leading, spacing: 0) {
        MiniCalendarView(date: entry.date)
          .padding(.bottom, 6)
        Spacer(minLength: 0)
      }
      .padding(10)
      .frame(maxHeight: .infinity, alignment: .topLeading)

      dividerAdaptive.frame(width: 1)

      // Right: quadrant sections
      VStack(alignment: .leading, spacing: 4) {
        ForEach(0..<qs.count, id: \.self) { i in
          let q = qs[i]
          VStack(alignment: .leading, spacing: 2) {
            HStack(spacing: 4) {
              Circle().fill(q.color).frame(width: 5, height: 5)
              Text(q.label)
                .font(.system(size: 9, weight: .bold))
                .foregroundColor(q.color)
                .lineLimit(1)
              Spacer()
              Text("\(q.tasks.count)")
                .font(.system(size: 9, weight: .semibold))
                .foregroundColor(.white)
                .padding(.horizontal, 4)
                .padding(.vertical, 1)
                .background(q.color)
                .cornerRadius(6)
            }
            ForEach(Array(q.tasks.prefix(maxPerQ))) { task in
              HStack(alignment: .top, spacing: 4) {
                Circle()
                  .stroke(q.color.opacity(0.6), lineWidth: 1)
                  .frame(width: 8, height: 8)
                  .padding(.top, 1)
                Text(task.title)
                  .font(.system(size: 10))
                  .foregroundColor(textPrimaryAdaptive)
                  .lineLimit(1)
              }
            }
          }
        }
        Spacer(minLength: 0)
      }
      .padding(10)
      .frame(maxHeight: .infinity, alignment: .topLeading)
    }
    .background(bgAdaptive)
  }
}

struct CalendarTasksWidget: Widget {
  let kind = "EisenhowerCalendarTasks"
  var body: some WidgetConfiguration {
    StaticConfiguration(kind: kind, provider: EisenhowerProvider()) { entry in
      if #available(iOS 17.0, *) {
        CalendarTasksEntryView(entry: entry).containerBackground(bgAdaptive, for: .widget)
      } else {
        CalendarTasksEntryView(entry: entry)
      }
    }
    .configurationDisplayName("Calendrier & Tâches")
    .description("Mini calendrier mensuel avec tâches par quadrant.")
    .supportedFamilies([.systemMedium, .systemLarge])
  }
}
