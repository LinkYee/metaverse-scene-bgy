import type { ProjectConfigInterface } from '@xrengine/projects/ProjectConfigInterface'

const config: ProjectConfigInterface = {
  onEvent: undefined,
  thumbnail: '/static/xrengine_thumbnail.jpg',
  worldInjection: () => import('./worldInjection'),
  webappInjection: () => import('./webappInjection'),
  routes: {
    '/ecommerce': {
      component: () => import('./routes/index')
    }
  },
  services: './services/services.ts',
  databaseSeed: undefined,
  settings: [
    {
      key: 'domain',
      type: '', // todo
      scopes: ['editor:write']
    },
    {
      key: 'shopifySecret',
      type: '', // todo
      scopes: ['editor:write']
    },
    {
      key: 'woocommerceSecret',
      type: '', // todo
      scopes: ['editor:write']
    },
    {
      key: 'woocommerceToken',
      type: '', // todo
      scopes: ['editor:write']
    }
  ]
}

export default config
