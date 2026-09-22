import WidgetKit
import SwiftUI
import EventKit

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

// MARK: - Today Widget (Date du jour)

private func frenchMonthName(_ date: Date) -> String {
  let months = ["JANVIER","FÉVRIER","MARS","AVRIL","MAI","JUIN",
                "JUILLET","AOÛT","SEPTEMBRE","OCTOBRE","NOVEMBRE","DÉCEMBRE"]
  return months[Calendar.current.component(.month, from: date) - 1]
}

private func frenchWeekdayName(_ date: Date) -> String {
  let days = ["dimanche","lundi","mardi","mercredi","jeudi","vendredi","samedi"]
  return days[Calendar.current.component(.weekday, from: date) - 1]
}

struct TodayEntryView: View {
  let entry: EisenhowerEntry

  var body: some View {
    let cal = Calendar.current
    let day = cal.component(.day, from: entry.date)
    VStack(alignment: .leading, spacing: 0) {
      Text(frenchMonthName(entry.date))
        .font(.system(size: 9, weight: .semibold))
        .foregroundColor(textSecondaryAdaptive)
      Text(frenchWeekdayName(entry.date))
        .font(.system(size: 13, weight: .semibold))
        .foregroundColor(q2Color)
      Text("\(day)")
        .font(.system(size: 44, weight: .bold))
        .foregroundColor(textPrimaryAdaptive)
        .minimumScaleFactor(0.6)
        .lineLimit(1)
      Spacer(minLength: 0)
      HStack(spacing: 6) {
        ForEach([
          (entry.data.q1.count, q1Color),
          (entry.data.q2.count, q2Color),
          (entry.data.q3.count, q3Color),
          (entry.data.q4.count, q4Color),
        ], id: \.1) { pair in
          HStack(spacing: 2) {
            Circle().fill(pair.1).frame(width: 6, height: 6)
            Text("\(pair.0)")
              .font(.system(size: 11, weight: .semibold))
              .foregroundColor(textPrimaryAdaptive)
          }
        }
      }
    }
    .padding(12)
    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
  }
}

struct TodayWidget: Widget {
  let kind = "EisenhowerToday"
  var body: some WidgetConfiguration {
    StaticConfiguration(kind: kind, provider: EisenhowerProvider()) { entry in
      if #available(iOS 17.0, *) {
        TodayEntryView(entry: entry).containerBackground(bgAdaptive, for: .widget)
      } else {
        TodayEntryView(entry: entry).background(bgAdaptive)
      }
    }
    .configurationDisplayName("Date du jour")
    .description("Date du jour avec résumé des quadrants.")
    .supportedFamilies([.systemSmall])
  }
}

// MARK: - Upcoming Tasks Widget (Tâches à venir)

struct UpcomingTasksEntryView: View {
  let entry: EisenhowerEntry
  @Environment(\.widgetFamily) private var family

  private struct TaggedTask {
    let task: WidgetTask
    let color: Color
  }

  private var allTasks: [TaggedTask] {
    [
      (entry.data.q1, q1Color),
      (entry.data.q2, q2Color),
      (entry.data.q3, q3Color),
      (entry.data.q4, q4Color),
    ].flatMap { pair in pair.0.map { TaggedTask(task: $0, color: pair.1) } }
  }

  var body: some View {
    let maxTasks = family == .systemSmall ? 5 : 10
    let visible = Array(allTasks.prefix(maxTasks))
    let remaining = allTasks.count - visible.count

    VStack(alignment: .leading, spacing: 0) {
      Text("À venir")
        .font(.system(size: 12, weight: .bold))
        .foregroundColor(q2Color)
        .padding(.bottom, 5)

      ForEach(Array(visible.enumerated()), id: \.offset) { _, tagged in
        HStack(spacing: 5) {
          Circle()
            .fill(tagged.color)
            .frame(width: 6, height: 6)
          Text(tagged.task.title)
            .font(.system(size: 11))
            .foregroundColor(textPrimaryAdaptive)
            .lineLimit(1)
        }
        .padding(.vertical, 2)
      }

      if remaining > 0 {
        Text("+\(remaining) de plus")
          .font(.system(size: 10))
          .foregroundColor(textSecondaryAdaptive)
          .padding(.top, 3)
      }

      if allTasks.isEmpty {
        Text("Aucune tâche")
          .font(.system(size: 11))
          .foregroundColor(textSecondaryAdaptive)
      }

      Spacer(minLength: 0)
    }
    .padding(12)
    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
  }
}

struct UpcomingTasksWidget: Widget {
  let kind = "EisenhowerUpcoming"
  var body: some WidgetConfiguration {
    StaticConfiguration(kind: kind, provider: EisenhowerProvider()) { entry in
      if #available(iOS 17.0, *) {
        UpcomingTasksEntryView(entry: entry).containerBackground(bgAdaptive, for: .widget)
      } else {
        UpcomingTasksEntryView(entry: entry).background(bgAdaptive)
      }
    }
    .configurationDisplayName("Tâches à venir")
    .description("Toutes les tâches par ordre de priorité.")
    .supportedFamilies([.systemSmall, .systemMedium])
  }
}

// MARK: - Board Widget (Tableau de bord — date + calendrier + 4 quadrants)

private struct BoardQuadrantCell: View {
  let tasks: [WidgetTask]
  let label: String
  let color: Color
  let icon: String

  var body: some View {
    VStack(alignment: .leading, spacing: 2) {
      HStack(spacing: 3) {
        Text(icon).font(.system(size: 9))
        Text(label)
          .font(.system(size: 8, weight: .bold))
          .foregroundColor(color)
          .lineLimit(1)
        Spacer(minLength: 0)
        Text("\(tasks.count)")
          .font(.system(size: 8, weight: .bold))
          .foregroundColor(color)
      }
      ForEach(Array(tasks.prefix(2).enumerated()), id: \.offset) { _, task in
        HStack(spacing: 3) {
          Circle()
            .stroke(color.opacity(0.6), lineWidth: 1)
            .frame(width: 5, height: 5)
          Text(task.title)
            .font(.system(size: 9))
            .foregroundColor(textPrimaryAdaptive)
            .lineLimit(1)
        }
      }
      if tasks.isEmpty {
        Text("—")
          .font(.system(size: 9))
          .foregroundColor(textSecondaryAdaptive)
      }
    }
    .frame(maxWidth: .infinity, alignment: .leading)
  }
}

struct BoardEntryView: View {
  let entry: EisenhowerEntry

  var body: some View {
    let cal = Calendar.current
    let day = cal.component(.day, from: entry.date)

    VStack(spacing: 0) {
      // Top half: date panel + mini calendar
      HStack(spacing: 0) {
        VStack(alignment: .leading, spacing: 1) {
          Text(frenchMonthName(entry.date))
            .font(.system(size: 8, weight: .semibold))
            .foregroundColor(textSecondaryAdaptive)
          Text(frenchWeekdayName(entry.date))
            .font(.system(size: 11, weight: .semibold))
            .foregroundColor(q2Color)
          Text("\(day)")
            .font(.system(size: 34, weight: .bold))
            .foregroundColor(textPrimaryAdaptive)
            .minimumScaleFactor(0.6)
            .lineLimit(1)
          Spacer(minLength: 0)
        }
        .padding(10)
        .frame(width: 82)

        Rectangle()
          .fill(dividerAdaptive)
          .frame(width: 1)

        MiniCalendarView(date: entry.date)
          .padding(8)
          .frame(maxWidth: .infinity)
      }
      .frame(maxHeight: .infinity)

      Rectangle()
        .fill(dividerAdaptive)
        .frame(height: 1)

      // Bottom half: 2×2 quadrant grid
      VStack(spacing: 0) {
        HStack(spacing: 0) {
          BoardQuadrantCell(tasks: entry.data.q1, label: "Important & Urgent",      color: q1Color, icon: "🔥")
            .padding(8)
          Rectangle().fill(dividerAdaptive).frame(width: 1)
          BoardQuadrantCell(tasks: entry.data.q2, label: "Important & Non urgent",  color: q2Color, icon: "📅")
            .padding(8)
        }
        Rectangle().fill(dividerAdaptive).frame(height: 1)
        HStack(spacing: 0) {
          BoardQuadrantCell(tasks: entry.data.q3, label: "Urgent & Moins important", color: q3Color, icon: "⚡")
            .padding(8)
          Rectangle().fill(dividerAdaptive).frame(width: 1)
          BoardQuadrantCell(tasks: entry.data.q4, label: "Non urgent & Non import.",  color: q4Color, icon: "🗑")
            .padding(8)
        }
      }
      .frame(maxHeight: .infinity)
    }
  }
}

struct BoardWidget: Widget {
  let kind = "EisenhowerBoard"
  var body: some WidgetConfiguration {
    StaticConfiguration(kind: kind, provider: EisenhowerProvider()) { entry in
      if #available(iOS 17.0, *) {
        BoardEntryView(entry: entry).containerBackground(bgAdaptive, for: .widget)
      } else {
        BoardEntryView(entry: entry).background(bgAdaptive)
      }
    }
    .configurationDisplayName("Tableau de bord")
    .description("Calendrier et vue complète de toutes les tâches.")
    .supportedFamilies([.systemLarge])
  }
}

// MARK: - EventKit helpers

private let ekStore = EKEventStore()

private func calendarAuthorized() -> Bool {
  let status = EKEventStore.authorizationStatus(for: .event)
  if #available(iOS 17, *) { return status == .fullAccess }
  return status == .authorized
}

private struct CalEvent {
  let title: String
  let startDate: Date
  let allDay: Bool
  let color: Color
}

private func loadMonthEvents(for date: Date) -> [Date: [CalEvent]] {
  guard calendarAuthorized() else { return [:] }
  let cal = Calendar.current
  var comps = cal.dateComponents([.year, .month], from: date)
  comps.day = 1
  guard let start = cal.date(from: comps),
        let end = cal.date(byAdding: .month, value: 1, to: start) else { return [:] }
  let pred = ekStore.predicateForEvents(startDate: start, endDate: end, calendars: nil)
  var byDay: [Date: [CalEvent]] = [:]
  for ev in ekStore.events(matching: pred) {
    let dayStart = cal.startOfDay(for: ev.startDate)
    let color = Color(UIColor(cgColor: ev.calendar.cgColor))
    byDay[dayStart, default: []].append(
      CalEvent(title: ev.title ?? "", startDate: ev.startDate, allDay: ev.isAllDay, color: color)
    )
  }
  return byDay
}

// MARK: - CalendarEntry + CalendarProvider

struct CalendarEntry: TimelineEntry {
  let date: Date
  let data: WidgetData
  let eventsByDay: [Date: [CalEvent]]
}

struct CalendarProvider: TimelineProvider {
  func placeholder(in context: Context) -> CalendarEntry {
    CalendarEntry(date: Date(), data: placeholderData(), eventsByDay: [:])
  }
  func getSnapshot(in context: Context, completion: @escaping (CalendarEntry) -> Void) {
    completion(CalendarEntry(date: Date(), data: loadWidgetData(), eventsByDay: loadMonthEvents(for: Date())))
  }
  func getTimeline(in context: Context, completion: @escaping (Timeline<CalendarEntry>) -> Void) {
    let entry = CalendarEntry(date: Date(), data: loadWidgetData(), eventsByDay: loadMonthEvents(for: Date()))
    let next = Calendar.current.date(byAdding: .hour, value: 1, to: Date())!
    completion(Timeline(entries: [entry], policy: .after(next)))
  }
}

// MARK: - Shared calendar grid view (with event dots)

private struct CalGridView: View {
  let entry: CalendarEntry
  let style: CalGridStyle

  enum CalGridStyle { case dots, bloc, classique }

  private let cal = Calendar.current
  private let letters = ["D", "L", "M", "M", "J", "V", "S"]

  private var today: Int { cal.component(.day, from: entry.date) }

  private var days: [Int?] {
    var comps = cal.dateComponents([.year, .month], from: entry.date)
    comps.day = 1
    guard let first = cal.date(from: comps) else { return [] }
    let weekday = cal.component(.weekday, from: first) - 1
    let range = cal.range(of: .day, in: .month, for: entry.date)!
    var result: [Int?] = Array(repeating: nil, count: weekday)
    result += (1...range.count).map { Optional($0) }
    return result
  }

  private func events(for day: Int) -> [CalEvent] {
    var comps = cal.dateComponents([.year, .month], from: entry.date)
    comps.day = day
    guard let d = cal.date(from: comps) else { return [] }
    return entry.eventsByDay[cal.startOfDay(for: d)] ?? []
  }

  var body: some View {
    let rows = days.chunks(of: 7)
    VStack(alignment: .leading, spacing: 2) {
      // Day-of-week header
      HStack(spacing: 0) {
        ForEach(letters, id: \.self) { l in
          Text(l)
            .font(.system(size: style == .classique ? 10 : 8, weight: .medium))
            .foregroundColor(textSecondaryAdaptive)
            .frame(maxWidth: .infinity)
        }
      }
      // Day rows
      ForEach(0..<rows.count, id: \.self) { r in
        HStack(spacing: 0) {
          ForEach(0..<7, id: \.self) { c in
            let idx = r * 7 + c
            let day = idx < days.count ? days[idx] : nil
            let evs = day.map { events(for: $0) } ?? []
            let isToday = day.map { $0 == today } ?? false

            VStack(spacing: 1) {
              ZStack {
                if isToday {
                  Circle().fill(q2Color).frame(width: style == .classique ? 22 : 16, height: style == .classique ? 22 : 16)
                } else if style == .bloc && !evs.isEmpty {
                  RoundedRectangle(cornerRadius: 3)
                    .fill(evs[0].color.opacity(0.25))
                    .frame(height: style == .classique ? 22 : 16)
                }
                Text(day.map { "\($0)" } ?? "")
                  .font(.system(size: style == .classique ? 12 : 9))
                  .foregroundColor(isToday ? .white : textPrimaryAdaptive)
              }
              if style != .bloc {
                // Dots below day
                HStack(spacing: 2) {
                  ForEach(Array(evs.prefix(3).enumerated()), id: \.offset) { _, ev in
                    Circle().fill(ev.color).frame(width: 3, height: 3)
                  }
                }
                .frame(height: 4)
              }
            }
            .frame(maxWidth: .infinity)
          }
        }
      }
    }
  }
}

// MARK: - Monthly Calendar — Default (event dots)

struct MonthCalDefaultEntryView: View {
  let entry: CalendarEntry

  var body: some View {
    VStack(alignment: .leading, spacing: 4) {
      Text(monthYearFormatter.string(from: entry.date).capitalized)
        .font(.system(size: 12, weight: .bold))
        .foregroundColor(textPrimaryAdaptive)
      CalGridView(entry: entry, style: .dots)
      if !calendarAuthorized() {
        Text("⚠ Accès calendrier requis")
          .font(.system(size: 9))
          .foregroundColor(textSecondaryAdaptive)
      }
      Spacer(minLength: 0)
    }
    .padding(12)
    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
  }
}

struct MonthCalDefaultWidget: Widget {
  let kind = "EisenhowerMonthDefault"
  var body: some WidgetConfiguration {
    StaticConfiguration(kind: kind, provider: CalendarProvider()) { entry in
      if #available(iOS 17.0, *) {
        MonthCalDefaultEntryView(entry: entry).containerBackground(bgAdaptive, for: .widget)
      } else {
        MonthCalDefaultEntryView(entry: entry).background(bgAdaptive)
      }
    }
    .configurationDisplayName("Calendrier mensuel")
    .description("Calendrier du mois avec événements.")
    .supportedFamilies([.systemMedium])
  }
}

// MARK: - Monthly Calendar — Bloc (event day blocks)

struct MonthCalBlocEntryView: View {
  let entry: CalendarEntry

  var body: some View {
    VStack(alignment: .leading, spacing: 4) {
      Text(monthYearFormatter.string(from: entry.date).capitalized)
        .font(.system(size: 12, weight: .bold))
        .foregroundColor(textPrimaryAdaptive)
      CalGridView(entry: entry, style: .bloc)
      Spacer(minLength: 0)
    }
    .padding(12)
    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
  }
}

struct MonthCalBlocWidget: Widget {
  let kind = "EisenhowerMonthBloc"
  var body: some WidgetConfiguration {
    StaticConfiguration(kind: kind, provider: CalendarProvider()) { entry in
      if #available(iOS 17.0, *) {
        MonthCalBlocEntryView(entry: entry).containerBackground(bgAdaptive, for: .widget)
      } else {
        MonthCalBlocEntryView(entry: entry).background(bgAdaptive)
      }
    }
    .configurationDisplayName("Calendrier mensuel — Bloc")
    .description("Calendrier avec blocs colorés pour les jours avec événements.")
    .supportedFamilies([.systemMedium])
  }
}

// MARK: - Monthly Calendar — Classique

struct MonthCalClassiqueEntryView: View {
  let entry: CalendarEntry

  var body: some View {
    VStack(alignment: .leading, spacing: 4) {
      HStack {
        Text(monthYearFormatter.string(from: entry.date).capitalized)
          .font(.system(size: 13, weight: .bold))
          .foregroundColor(textPrimaryAdaptive)
        Spacer()
        Text("\(Calendar.current.component(.year, from: entry.date))")
          .font(.system(size: 11))
          .foregroundColor(textSecondaryAdaptive)
      }
      CalGridView(entry: entry, style: .classique)
      Spacer(minLength: 0)
    }
    .padding(12)
    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
  }
}

struct MonthCalClassiqueWidget: Widget {
  let kind = "EisenhowerMonthClassique"
  var body: some WidgetConfiguration {
    StaticConfiguration(kind: kind, provider: CalendarProvider()) { entry in
      if #available(iOS 17.0, *) {
        MonthCalClassiqueEntryView(entry: entry).containerBackground(bgAdaptive, for: .widget)
      } else {
        MonthCalClassiqueEntryView(entry: entry).background(bgAdaptive)
      }
    }
    .configurationDisplayName("Calendrier mensuel — Classique")
    .description("Calendrier épuré style classique.")
    .supportedFamilies([.systemSmall, .systemMedium])
  }
}

// MARK: - Schedule Widget (Emploi du temps)

private let timeFormatter: DateFormatter = {
  let f = DateFormatter()
  f.dateFormat = "HH:mm"
  return f
}()

struct ScheduleEntryView: View {
  let entry: CalendarEntry
  @Environment(\.widgetFamily) private var family

  private var todayEvents: [CalEvent] {
    let start = Calendar.current.startOfDay(for: entry.date)
    return (entry.eventsByDay[start] ?? []).sorted { $0.startDate < $1.startDate }
  }

  var body: some View {
    let maxEvents = family == .systemMedium ? 5 : 8
    let events = Array(todayEvents.prefix(maxEvents))
    let remaining = todayEvents.count - events.count
    let day = Calendar.current.component(.day, from: entry.date)

    HStack(spacing: 0) {
      // Left: date
      VStack(alignment: .leading, spacing: 1) {
        Text(frenchMonthName(entry.date))
          .font(.system(size: 8, weight: .semibold))
          .foregroundColor(textSecondaryAdaptive)
        Text(frenchWeekdayName(entry.date))
          .font(.system(size: 11, weight: .semibold))
          .foregroundColor(q2Color)
        Text("\(day)")
          .font(.system(size: 34, weight: .bold))
          .foregroundColor(textPrimaryAdaptive)
          .minimumScaleFactor(0.6)
          .lineLimit(1)
        Spacer(minLength: 0)
      }
      .padding(10)
      .frame(width: 84)

      Rectangle().fill(dividerAdaptive).frame(width: 1)

      // Right: events
      VStack(alignment: .leading, spacing: 5) {
        Text("Aujourd'hui")
          .font(.system(size: 10, weight: .bold))
          .foregroundColor(textSecondaryAdaptive)

        if events.isEmpty {
          Text(calendarAuthorized() ? "Aucun événement" : "⚠ Accès calendrier requis")
            .font(.system(size: 11))
            .foregroundColor(textSecondaryAdaptive)
        } else {
          ForEach(Array(events.enumerated()), id: \.offset) { _, ev in
            HStack(spacing: 6) {
              Rectangle()
                .fill(ev.color)
                .frame(width: 3)
                .cornerRadius(1.5)
              VStack(alignment: .leading, spacing: 1) {
                if !ev.allDay {
                  Text(timeFormatter.string(from: ev.startDate))
                    .font(.system(size: 9))
                    .foregroundColor(textSecondaryAdaptive)
                }
                Text(ev.title)
                  .font(.system(size: 11, weight: .medium))
                  .foregroundColor(textPrimaryAdaptive)
                  .lineLimit(1)
              }
            }
          }
          if remaining > 0 {
            Text("+\(remaining) de plus")
              .font(.system(size: 9))
              .foregroundColor(textSecondaryAdaptive)
          }
        }
        Spacer(minLength: 0)
      }
      .padding(10)
    }
    .frame(maxWidth: .infinity, maxHeight: .infinity)
  }
}

struct ScheduleWidget: Widget {
  let kind = "EisenhowerSchedule"
  var body: some WidgetConfiguration {
    StaticConfiguration(kind: kind, provider: CalendarProvider()) { entry in
      if #available(iOS 17.0, *) {
        ScheduleEntryView(entry: entry).containerBackground(bgAdaptive, for: .widget)
      } else {
        ScheduleEntryView(entry: entry).background(bgAdaptive)
      }
    }
    .configurationDisplayName("Emploi du temps")
    .description("Vos événements du jour.")
    .supportedFamilies([.systemMedium, .systemLarge])
  }
}

// MARK: - Full Calendar Widget (Large, with event labels)

struct FullCalEntryView: View {
  let entry: CalendarEntry

  private let cal = Calendar.current
  private let letters = ["D", "L", "M", "M", "J", "V", "S"]

  private var today: Int { cal.component(.day, from: entry.date) }

  private var days: [Int?] {
    var comps = cal.dateComponents([.year, .month], from: entry.date)
    comps.day = 1
    guard let first = cal.date(from: comps) else { return [] }
    let weekday = cal.component(.weekday, from: first) - 1
    let range = cal.range(of: .day, in: .month, for: entry.date)!
    var result: [Int?] = Array(repeating: nil, count: weekday)
    result += (1...range.count).map { Optional($0) }
    return result
  }

  private func events(for day: Int) -> [CalEvent] {
    var comps = cal.dateComponents([.year, .month], from: entry.date)
    comps.day = day
    guard let d = cal.date(from: comps) else { return [] }
    return entry.eventsByDay[cal.startOfDay(for: d)] ?? []
  }

  var body: some View {
    let rows = days.chunks(of: 7)
    VStack(alignment: .leading, spacing: 2) {
      Text(monthYearFormatter.string(from: entry.date).capitalized)
        .font(.system(size: 13, weight: .bold))
        .foregroundColor(textPrimaryAdaptive)
        .padding(.bottom, 2)

      // Day-of-week header
      HStack(spacing: 0) {
        ForEach(letters, id: \.self) { l in
          Text(l)
            .font(.system(size: 10, weight: .medium))
            .foregroundColor(textSecondaryAdaptive)
            .frame(maxWidth: .infinity)
        }
      }

      // Day rows with event labels
      ForEach(0..<rows.count, id: \.self) { r in
        HStack(alignment: .top, spacing: 2) {
          ForEach(0..<7, id: \.self) { c in
            let idx = r * 7 + c
            let day = idx < days.count ? days[idx] : nil
            let evs = day.map { events(for: $0) } ?? []
            let isToday = day.map { $0 == today } ?? false

            VStack(alignment: .leading, spacing: 1) {
              // Day number
              ZStack {
                if isToday {
                  Circle().fill(q2Color).frame(width: 20, height: 20)
                }
                Text(day.map { "\($0)" } ?? "")
                  .font(.system(size: 11, weight: isToday ? .bold : .regular))
                  .foregroundColor(isToday ? .white : textPrimaryAdaptive)
              }
              .frame(maxWidth: .infinity)

              // Event pills (up to 2)
              ForEach(Array(evs.prefix(2).enumerated()), id: \.offset) { _, ev in
                Text(ev.allDay ? ev.title : "\(timeFormatter.string(from: ev.startDate)) \(ev.title)")
                  .font(.system(size: 7, weight: .medium))
                  .foregroundColor(.white)
                  .lineLimit(1)
                  .padding(.horizontal, 2)
                  .padding(.vertical, 1)
                  .background(ev.color)
                  .cornerRadius(2)
              }
              if evs.count > 2 {
                Text("+\(evs.count - 2)")
                  .font(.system(size: 7))
                  .foregroundColor(textSecondaryAdaptive)
              }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
          }
        }
        .frame(maxHeight: .infinity)
      }
    }
    .padding(12)
    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
  }
}

struct FullCalWidget: Widget {
  let kind = "EisenhowerFullCal"
  var body: some WidgetConfiguration {
    StaticConfiguration(kind: kind, provider: CalendarProvider()) { entry in
      if #available(iOS 17.0, *) {
        FullCalEntryView(entry: entry).containerBackground(bgAdaptive, for: .widget)
      } else {
        FullCalEntryView(entry: entry).background(bgAdaptive)
      }
    }
    .configurationDisplayName("Calendrier complet")
    .description("Vue complète du mois avec vos événements.")
    .supportedFamilies([.systemLarge])
  }
}
