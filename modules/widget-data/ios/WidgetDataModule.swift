import ExpoModulesCore
import Foundation
import WidgetKit

public class WidgetDataModule: Module {
  public func definition() -> ModuleDefinition {
    Name("WidgetData")

    AsyncFunction("setTasks") { (tasksJson: String) in
      let defaults = UserDefaults(suiteName: "group.com.darchevert.eisenhower")
      defaults?.set(tasksJson, forKey: "widget_tasks")
      defaults?.synchronize()
      if #available(iOS 14.0, *) {
        WidgetCenter.shared.reloadAllTimelines()
      }
    }
  }
}
