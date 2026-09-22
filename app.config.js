module.exports = {
  expo: {
    name: "Eisenhower - Priority Matrix",
    slug: "eisenhower",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#0F172A",
    },
    ios: {
      supportsTablet: false,
      bundleIdentifier: "com.darchevert.eisenhower",
      entitlements: {
        "com.apple.security.application-groups": ["group.com.darchevert.eisenhower"],
      },
    },
    android: {
      package: "com.darchevert.eisenhower",
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#0F172A",
      },
      edgeToEdgeEnabled: true,
    },
    web: {
      favicon: "./assets/favicon.png",
      bundler: "metro",
      output: "single",
    },
    extra: {
      eas: {
        projectId: "d5f2dc0d-a751-4064-bb71-e6b6b675a4f4",
      },
    },
    owner: "darchevert",
    plugins: [
      ["@bacons/apple-targets"],
      [
        "react-native-android-widget",
        {
          widgets: [
            {
              name: "Eisenhower",
              label: "Eisenhower — Do First",
              minWidth: "180dp",
              minHeight: "110dp",
              targetCellWidth: 3,
              targetCellHeight: 2,
              description: "Urgent & important tasks",
              widgetFeatures: ["reconfigurable", "configuration_optional"],
            },
            {
              name: "EisenhowerQ2",
              label: "Eisenhower — Schedule",
              minWidth: "180dp",
              minHeight: "110dp",
              targetCellWidth: 3,
              targetCellHeight: 2,
              description: "Important but not urgent tasks",
              widgetFeatures: ["reconfigurable", "configuration_optional"],
            },
            {
              name: "EisenhowerQ3",
              label: "Eisenhower — Delegate",
              minWidth: "180dp",
              minHeight: "110dp",
              targetCellWidth: 3,
              targetCellHeight: 2,
              description: "Urgent but not important tasks",
              widgetFeatures: ["reconfigurable", "configuration_optional"],
            },
            {
              name: "EisenhowerQ4",
              label: "Eisenhower — Eliminate",
              minWidth: "180dp",
              minHeight: "110dp",
              targetCellWidth: 3,
              targetCellHeight: 2,
              description: "Neither urgent nor important tasks",
              widgetFeatures: ["reconfigurable", "configuration_optional"],
            },
            {
              name: "EisenhowerMatrix",
              label: "Eisenhower Matrix",
              minWidth: "250dp",
              minHeight: "200dp",
              targetCellWidth: 4,
              targetCellHeight: 3,
              description: "All four quadrants at a glance",
              widgetFeatures: ["reconfigurable", "configuration_optional"],
            },
          ],
        },
      ],
      [
        "react-native-google-mobile-ads",
        {
          androidAppId: process.env.ADMOB_APP_ID_ANDROID || "ca-app-pub-3940256099942544~3347511713",
          iosAppId: process.env.ADMOB_APP_ID_IOS || "ca-app-pub-3940256099942544~3347511713",
        },
      ],
      [
        "expo-notifications",
        {
          color: "#EF4444",
        },
      ],
    ],
  },
};
