import { ConfigPlugin, withAndroidManifest } from "@expo/config-plugins";

const withScreenTimePermission: ConfigPlugin = (config) => {
  return withAndroidManifest(config, (config) => {
    const manifest = config.modResults.manifest;

    // Add PACKAGE_USAGE_STATS permission
    if (!manifest["uses-permission"]) {
      manifest["uses-permission"] = [];
    }

    const hasPermission = manifest["uses-permission"].some(
      (p) => p.$["android:name"] === "android.permission.PACKAGE_USAGE_STATS",
    );

    if (!hasPermission) {
      manifest["uses-permission"].push({
        $: {
          "android:name": "android.permission.PACKAGE_USAGE_STATS",
          "tools:ignore": "ProtectedPermissions",
        },
      });
    }

    // Cast to any to bypass missing provider type
    const application = manifest.application?.[0] as any;
    if (application) {
      if (!application.provider) application.provider = [];

      const hasProvider = application.provider.some(
        (p: any) =>
          p.$["android:name"] === "androidx.startup.InitializationProvider",
      );

      if (!hasProvider) {
        application.provider.push({
          $: {
            "android:name": "androidx.startup.InitializationProvider",
            "android:authorities": "${applicationId}.androidx-startup",
            "android:exported": "false",
            "tools:node": "merge",
          },
          "meta-data": [
            {
              $: {
                "android:name": "androidx.work.WorkManagerInitializer",
                "android:value": "androidx.startup",
              },
            },
          ],
        });
      }
    }

    return config;
  });
};

export default withScreenTimePermission;
