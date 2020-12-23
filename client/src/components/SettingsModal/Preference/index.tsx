import React from 'react';
import { observer } from 'mobx-react-lite';
import { Switch } from '@material-ui/core';
import { useStore } from 'store';
import Api from 'api';

export const Preference = observer(() => {
  const { userStore } = useStore();
  const { user } = userStore;

  return (
    <div className="profile-edit flex flex-col items-center md:items-start -mt-2 pb-2 md:pb-0">
      <div className="flex items-center w-full pt-3">
        <div className="font-bold text-14 text-gray-700">允许别人收录我的文章：</div>
        <Switch
          color="primary"
          checked={!user.privateContributionEnabled}
          onChange={async (e) => {
            user.privateContributionEnabled = !e.target.checked;
            try {
              await Api.updateUser({
                privateContributionEnabled: user.privateContributionEnabled,
              });
            } catch (err) {
              console.log(err);
            }
          }}
        />
      </div>

      <div className="flex items-center w-full">
        <div className="font-bold text-14 text-gray-700">允许别人查看我的关注和被关注列表：</div>
        <Switch
          color="primary"
          checked={!user.privateSubscriptionEnabled}
          onChange={async (e) => {
            user.privateSubscriptionEnabled = !e.target.checked;
            try {
              await Api.updateUser({
                privateSubscriptionEnabled: user.privateSubscriptionEnabled,
              });
            } catch (err) {
              console.log(err);
            }
          }}
        />
      </div>
    </div>
  );
});
