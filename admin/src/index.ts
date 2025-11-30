import { PLUGIN_ID } from './pluginId';
import { Initializer } from './components/Initializer';
import { PluginIcon } from './components/PluginIcon';

export default {
  register(app: any) {
    app.addMenuLink({
      to: `plugins/${PLUGIN_ID}`,
      icon: PluginIcon,
      intlLabel: {
        id: `${PLUGIN_ID}.plugin.name`,
        defaultMessage: PLUGIN_ID,
      },
      Component: async () => {
        const { App } = await import('./pages/App');

        return App;
      },
    });

    app.registerPlugin({
      id: PLUGIN_ID,
      initializer: Initializer,
      isReady: false,
      name: PLUGIN_ID,
    });
  },

  async registerTrads({ locales }: { locales: string[] }) {
    return Promise.all(
      locales.map(async (locale) => {
        try {
          const { default: data } = await import(`./translations/${locale}.json`);

          // Transform keys to include plugin ID prefix
          const transformedData = Object.keys(data).reduce(
            (acc, key) => {
              acc[`${PLUGIN_ID}.${key}`] = data[key];
              return acc;
            },
            {} as Record<string, string>
          );

          return {
            data: transformedData,
            locale,
          };
        } catch {
          return {
            data: {},
            locale,
          };
        }
      })
    );
  },
};
