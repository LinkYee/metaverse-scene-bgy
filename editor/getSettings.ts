import { API } from '@xrengine/client-core/src/API'

import { SettingsInterface } from '../utils/SettingsInterface'

export const getSettings = async () =>
  (
    await API.instance.client.service('project-setting').find({
      query: {
        $limit: 1,
        name: 'XREngine-Project-eCommerce',
        $select: ['settings']
      }
    })
  ).reduce((obj, item) => Object.assign(obj, { [item.key]: item.value }), {}) as SettingsInterface
