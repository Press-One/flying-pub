const addDefaultValue = (settings: any) => {
  settings['mixinApp.name'] = settings['mixinApp.name'] || 'Mixin';
  settings['mixinApp.downloadUrl'] =
    settings['mixinApp.downloadUrl'] || 'https://mixin-www.zeromesh.net/messenger';
  settings['mixinApp.logo'] =
    settings['mixinApp.logo'] || 'https://img-cdn.xue.cn/917-mixin-app-logo.png';
  settings['site.logo'] = settings['site.logo'] || 'https://img-cdn.xue.cn/17-flying-pub.png';
  return settings;
};

export function createSettingsStore() {
  return {
    settings: {
      extra: {},
    } as Record<string, any>,
    setSettings(settings: any = {}) {
      this.settings = addDefaultValue(settings);
    },
    updateSettings(data: any = {}) {
      for (const key in data) {
        this.settings[key] = data[key]; 
      }
    },
  };
}
