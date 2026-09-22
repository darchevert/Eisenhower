import ExpoModulesCore
import Foundation
import WidgetKit

public class WidgetDataModule: Module {
  public func definition() -> ModuleDefinition {
    Name("WidgetData")

    // Legacy — writes Q1-only array to widget_tasks key
    AsyncFunction("setTasks") { (tasksJson: String) in
      let defaults = UserDefaults(suiteName: "group.com.darchevert.eisenhower")
      defaults?.set(tasksJson, forKey: "widget_tasks")
      defaults?.synchronize()
      if #available(iOS 14.0, *) {
        WidgetCenter.shared.reloadAllTimelines()
      }
    }

    // Full data — writes {q1,q2,q3,q4} to widget_data key
    AsyncFunction("setWidgetData") { (dataJson: String) in
      let defaults = UserDefaults(suiteName: "group.com.darchevert.eisenhower")
      defaults?.set(dataJson, forKey: "widget_data")
      defaults?.synchronize()
      if #available(iOS 14.0, *) {
        WidgetCenter.shared.reloadAllTimelines()
      }
    }
  }
}
