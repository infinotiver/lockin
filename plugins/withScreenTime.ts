import { ConfigPlugin, withAndroidManifest } from "@expo/config-plugins";

const withScreenTimePermission: ConfigPlugin = (config) => {
  return withAndroidManifest(config, (config) => {
    const manifest = config.modResults.manifest;

    // add usage stats permission
    if (!manifest["uses-permission"]) {
      manifest["uses-permission"] = [];
    }

    const hasPermission = manifest["uses-permission"].some(
      (p) => p.$["android:name"] === "android.permission.PACKAGE_USAGE_STATS",
    );

    if (!hasPermission) {
      manifest["uses-permission"].push({
        $: { "android:name": "android.permission.PACKAGE_USAGE_STATS" },
      });
    }

    // patch the startup provider
    const application = manifest.application?.[0] as any;
    if (application) {
      if (!application.provider) application.provider = [];

      // reuse the existing provider if present
      let provider = application.provider.find(
        (p: any) =>
          p.$["android:name"] === "androidx.startup.InitializationProvider",
      );

      // add the provider if missing
      if (!provider) {
        provider = {
          $: {
            "android:name": "androidx.startup.InitializationProvider",
            "android:authorities": "${applicationId}.androidx-startup",
            "android:exported": "false",
            "tools:node": "merge",
          },
          "meta-data": [],
        };
        application.provider.push(provider);
      }

      // keep workmanager init registered
      if (!provider["meta-data"]) provider["meta-data"] = [];

      const hasMetaData = provider["meta-data"].some(
        (m: any) =>
          m.$["android:name"] === "androidx.work.WorkManagerInitializer",
      );

      if (!hasMetaData) {
        provider["meta-data"].push({
          $: {
            "android:name": "androidx.work.WorkManagerInitializer",
            "android:value": "androidx.startup",
          },
        });
      }
    }

    return config;
  });
};

export default withScreenTimePermission;
