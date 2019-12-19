export function createSettingsStore() {
  return {
    settings: {},
    setSettings(settings: any = {}) {
      this.settings = settings;
    },
  };
}
