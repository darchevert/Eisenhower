import WidgetKit
import SwiftUI

struct WidgetTask: Codable, Identifiable {
  let id: String
  let title: String
}

struct EisenhowerEntry: TimelineEntry {
  let date: Date
  let tasks: [WidgetTask]
}

struct EisenhowerProvider: TimelineProvider {
  func placeholder(in context: Context) -> EisenhowerEntry {
    EisenhowerEntry(date: Date(), tasks: [
      WidgetTask(id: "1", title: "Prepare quarterly report"),
      WidgetTask(id: "2", title: "Team standup meeting"),
      WidgetTask(id: "3", title: "Client proposal"),
    ])
  }

  func getSnapshot(in context: Context, completion: @escaping (EisenhowerEntry) -> Void) {
    completion(EisenhowerEntry(date: Date(), tasks: loadTasks()))
  }

  func getTimeline(in context: Context, completion: @escaping (Timeline<EisenhowerEntry>) -> Void) {
    let entry = EisenhowerEntry(date: Date(), tasks: loadTasks())
    let nextUpdate = Calendar.current.date(byAdding: .hour, value: 1, to: Date())!
    let timeline = Timeline(entries: [entry], policy: .after(nextUpdate))
    completion(timeline)
  }

  private func loadTasks() -> [WidgetTask] {
    guard
      let defaults = UserDefaults(suiteName: "group.com.darchevert.eisenhower"),
      let json = defaults.string(forKey: "widget_tasks"),
      let data = json.data(using: .utf8),
      let tasks = try? JSONDecoder().decode([WidgetTask].self, from: data)
    else { return [] }
    return Array(tasks.prefix(5))
  }
}

struct EisenhowerWidgetEntryView: View {
  var entry: EisenhowerProvider.Entry
  @Environment(\.widgetFamily) var family

  private let bg = Color(red: 0.059, green: 0.09, blue: 0.165)
  private let red = Color(red: 0.937, green: 0.267, blue: 0.267)
  private let textPrimary = Color(red: 0.886, green: 0.914, blue: 0.941)
  private let textSecondary = Color(red: 0.392, green: 0.455, blue: 0.533)

  var body: some View {
    VStack(alignment: .leading, spacing: 5) {
      HStack(spacing: 5) {
        Circle()
          .fill(red)
          .frame(width: 7, height: 7)
        Text("Do First")
          .font(.system(size: 12, weight: .bold))
          .foregroundColor(red)
        Spacer()
        Image(systemName: "grid.circle.fill")
          .font(.system(size: 11))
          .foregroundColor(textSecondary)
      }

      Rectangle()
        .fill(red.opacity(0.25))
        .frame(height: 1)
        .padding(.vertical, 1)

      if entry.tasks.isEmpty {
        Spacer()
        Text("No urgent tasks")
          .font(.system(size: 12))
          .foregroundColor(textSecondary)
          .italic()
        Spacer()
      } else {
        ForEach(entry.tasks.prefix(family == .systemSmall ? 3 : 5)) { task in
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
    .background(bg)
  }
}

struct EisenhowerWidget: Widget {
  let kind = "EisenhowerWidget"

  var body: some WidgetConfiguration {
    StaticConfiguration(kind: kind, provider: EisenhowerProvider()) { entry in
      if #available(iOS 17.0, *) {
        EisenhowerWidgetEntryView(entry: entry)
          .containerBackground(Color(red: 0.059, green: 0.09, blue: 0.165), for: .widget)
      } else {
        EisenhowerWidgetEntryView(entry: entry)
      }
    }
    .configurationDisplayName("Do First")
    .description("Vos tâches urgentes et importantes.")
    .supportedFamilies([.systemSmall, .systemMedium])
  }
}
