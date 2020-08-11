export function createSettingsStore() {
  return {
    settings: {
      extra: {},
    },
    setSettings(settings: any = {}) {
      this.settings = settings;
    },
  };
}
