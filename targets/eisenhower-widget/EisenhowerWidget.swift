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

// MARK: - Shared loading

private let APP_GROUP = "group.com.darchevert.eisenhower"

private func loadWidgetData() -> WidgetData {
  if let defaults = UserDefaults(suiteName: APP_GROUP),
     let json = defaults.string(forKey: "widget_data"),
     let raw = json.data(using: .utf8),
     let parsed = try? JSONDecoder().decode(WidgetData.self, from: raw) {
    return parsed
  }
  // Legacy fallback: read Q1-only key
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
         WidgetTask(id: "2", title: "Team standup"),
         WidgetTask(id: "3", title: "Fix critical bug")],
    q2: [WidgetTask(id: "4", title: "Learn SwiftUI"),
         WidgetTask(id: "5", title: "Exercise plan")],
    q3: [WidgetTask(id: "6", title: "Reply to emails"),
         WidgetTask(id: "7", title: "Book meeting room")],
    q4: [WidgetTask(id: "8", title: "Old newsletter"),
         WidgetTask(id: "9", title: "Junk folder")]
  )
}

// MARK: - Shared provider

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

// MARK: - Colors

private let bgColor        = Color(red: 0.059, green: 0.090, blue: 0.165)
private let textPrimary    = Color(red: 0.886, green: 0.914, blue: 0.941)
private let textSecondary  = Color(red: 0.392, green: 0.455, blue: 0.533)
private let q1Color        = Color(red: 0.937, green: 0.267, blue: 0.267) // #EF4444
private let q2Color        = Color(red: 0.133, green: 0.773, blue: 0.369) // #22C55E
private let q3Color        = Color(red: 0.961, green: 0.620, blue: 0.043) // #F59E0B
private let q4Color        = Color(red: 0.392, green: 0.455, blue: 0.533) // #64748B

// MARK: - Shared quadrant task list view

struct QuadrantListView: View {
  let tasks: [WidgetTask]
  let accentColor: Color
  let label: String
  let iconName: String
  @Environment(\.widgetFamily) var family

  private var maxTasks: Int {
    switch family {
    case .systemSmall: return 2
    default: return 5
    }
  }

  var body: some View {
    VStack(alignment: .leading, spacing: 4) {
      HStack(spacing: 5) {
        Circle()
          .fill(accentColor)
          .frame(width: 7, height: 7)
        Text(label)
          .font(.system(size: 12, weight: .bold))
          .foregroundColor(accentColor)
        Spacer()
        Image(systemName: iconName)
          .font(.system(size: 11))
          .foregroundColor(textSecondary)
      }

      Rectangle()
        .fill(accentColor.opacity(0.25))
        .frame(height: 1)
        .padding(.vertical, 1)

      if tasks.isEmpty {
        Spacer()
        Text("No tasks")
          .font(.system(size: 12))
          .foregroundColor(textSecondary)
          .italic()
        Spacer()
      } else {
        ForEach(Array(tasks.prefix(maxTasks))) { task in
          HStack(alignment: .top, spacing: 5) {
            Circle()
              .fill(textSecondary.opacity(0.6))
              .frame(width: 5, height: 5)
              .padding(.top, 4)
            Text(task.title)
              .font(.system(size: 12))
              .foregroundColor(textPrimary)
              .lineLimit(1)
          }
        }
        Spacer(minLength: 0)
      }
    }
    .padding(12)
    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
    .background(bgColor)
  }
}

// MARK: - Q1 widget

struct Q1EntryView: View {
  var entry: EisenhowerEntry
  var body: some View {
    QuadrantListView(
      tasks: entry.data.q1,
      accentColor: q1Color,
      label: "Do First",
      iconName: "exclamationmark.circle.fill"
    )
  }
}

struct Q1Widget: Widget {
  let kind = "EisenhowerWidget"

  var body: some WidgetConfiguration {
    StaticConfiguration(kind: kind, provider: EisenhowerProvider()) { entry in
      if #available(iOS 17.0, *) {
        Q1EntryView(entry: entry)
          .containerBackground(bgColor, for: .widget)
      } else {
        Q1EntryView(entry: entry)
      }
    }
    .configurationDisplayName("Do First")
    .description("Urgent & important tasks.")
    .supportedFamilies([.systemSmall, .systemMedium])
  }
}

// MARK: - Q2 widget

struct Q2EntryView: View {
  var entry: EisenhowerEntry
  var body: some View {
    QuadrantListView(
      tasks: entry.data.q2,
      accentColor: q2Color,
      label: "Schedule",
      iconName: "calendar"
    )
  }
}

struct Q2Widget: Widget {
  let kind = "EisenhowerQ2"

  var body: some WidgetConfiguration {
    StaticConfiguration(kind: kind, provider: EisenhowerProvider()) { entry in
      if #available(iOS 17.0, *) {
        Q2EntryView(entry: entry)
          .containerBackground(bgColor, for: .widget)
      } else {
        Q2EntryView(entry: entry)
      }
    }
    .configurationDisplayName("Schedule")
    .description("Important but not urgent tasks.")
    .supportedFamilies([.systemSmall, .systemMedium])
  }
}

// MARK: - Q3 widget

struct Q3EntryView: View {
  var entry: EisenhowerEntry
  var body: some View {
    QuadrantListView(
      tasks: entry.data.q3,
      accentColor: q3Color,
      label: "Delegate",
      iconName: "arrow.turn.up.right"
    )
  }
}

struct Q3Widget: Widget {
  let kind = "EisenhowerQ3"

  var body: some WidgetConfiguration {
    StaticConfiguration(kind: kind, provider: EisenhowerProvider()) { entry in
      if #available(iOS 17.0, *) {
        Q3EntryView(entry: entry)
          .containerBackground(bgColor, for: .widget)
      } else {
        Q3EntryView(entry: entry)
      }
    }
    .configurationDisplayName("Delegate")
    .description("Urgent but not important tasks.")
    .supportedFamilies([.systemSmall, .systemMedium])
  }
}

// MARK: - Q4 widget

struct Q4EntryView: View {
  var entry: EisenhowerEntry
  var body: some View {
    QuadrantListView(
      tasks: entry.data.q4,
      accentColor: q4Color,
      label: "Eliminate",
      iconName: "trash"
    )
  }
}

struct Q4Widget: Widget {
  let kind = "EisenhowerQ4"

  var body: some WidgetConfiguration {
    StaticConfiguration(kind: kind, provider: EisenhowerProvider()) { entry in
      if #available(iOS 17.0, *) {
        Q4EntryView(entry: entry)
          .containerBackground(bgColor, for: .widget)
      } else {
        Q4EntryView(entry: entry)
      }
    }
    .configurationDisplayName("Eliminate")
    .description("Neither urgent nor important tasks.")
    .supportedFamilies([.systemSmall, .systemMedium])
  }
}

// MARK: - Matrix overview widget

struct QuadrantCellView: View {
  let tasks: [WidgetTask]
  let color: Color
  let label: String
  let maxTasks: Int

  var body: some View {
    VStack(alignment: .leading, spacing: 3) {
      HStack(spacing: 4) {
        Circle()
          .fill(color)
          .frame(width: 5, height: 5)
        Text(label)
          .font(.system(size: 10, weight: .bold))
          .foregroundColor(color)
          .lineLimit(1)
      }
      Rectangle()
        .fill(color.opacity(0.2))
        .frame(height: 1)
        .padding(.bottom, 1)
      if tasks.isEmpty {
        Text("—")
          .font(.system(size: 10))
          .foregroundColor(textSecondary)
      } else {
        ForEach(Array(tasks.prefix(maxTasks))) { task in
          Text(task.title)
            .font(.system(size: 10))
            .foregroundColor(textPrimary)
            .lineLimit(1)
        }
      }
      Spacer(minLength: 0)
    }
    .padding(8)
    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
  }
}

struct MatrixEntryView: View {
  var entry: EisenhowerEntry
  @Environment(\.widgetFamily) var family

  private var maxPerQuadrant: Int {
    family == .systemLarge ? 3 : 2
  }

  private let dividerColor = Color(red: 0.118, green: 0.161, blue: 0.235)

  var body: some View {
    VStack(spacing: 0) {
      HStack(spacing: 0) {
        QuadrantCellView(tasks: entry.data.q1, color: q1Color, label: "Do First",  maxTasks: maxPerQuadrant)
        dividerColor.frame(width: 1)
        QuadrantCellView(tasks: entry.data.q2, color: q2Color, label: "Schedule",  maxTasks: maxPerQuadrant)
      }
      dividerColor.frame(height: 1)
      HStack(spacing: 0) {
        QuadrantCellView(tasks: entry.data.q3, color: q3Color, label: "Delegate",  maxTasks: maxPerQuadrant)
        dividerColor.frame(width: 1)
        QuadrantCellView(tasks: entry.data.q4, color: q4Color, label: "Eliminate", maxTasks: maxPerQuadrant)
      }
    }
    .background(bgColor)
  }
}

struct MatrixWidget: Widget {
  let kind = "EisenhowerMatrix"

  var body: some WidgetConfiguration {
    StaticConfiguration(kind: kind, provider: EisenhowerProvider()) { entry in
      if #available(iOS 17.0, *) {
        MatrixEntryView(entry: entry)
          .containerBackground(bgColor, for: .widget)
      } else {
        MatrixEntryView(entry: entry)
      }
    }
    .configurationDisplayName("Eisenhower Matrix")
    .description("All four quadrants at a glance.")
    .supportedFamilies([.systemMedium, .systemLarge])
  }
}
