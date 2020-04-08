import React from 'react';
import { observer } from 'mobx-react-lite';
import BlockIcon from '@material-ui/icons/Block';
import { useStore } from 'store';

export default observer(() => {
  const { settingsStore } = useStore();
  const { settings } = settingsStore;

  return (
    <div className="flex items-center justify-center h-screen text-center">
      <div className="-mt-64">
        <div className="text-6xl text-red-500">
          <BlockIcon />
        </div>
        <div className="mt-2 text-lg text-gray-700 font-bold">
          {settings['permission.denyText']}
        </div>
        <div className="mt-4">
          <a className="font-bold text-blue-400" href={settings['permission.denyActionLink']}>
            {settings['permission.denyActionText']}
          </a>
        </div>
      </div>
    </div>
  );
});
