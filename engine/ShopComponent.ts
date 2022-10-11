import { createMappedComponent } from '@xrengine/engine/src/ecs/functions/ComponentFunctions'

export type ProductType = {
  title: string
  description: string
  storeUrl: string
  id: string
  variants: Array<{
    id: string
    title: string
    priceV2: {
      amount: number
      currencyCode: string
    }
  }>
  label: string
  media: any
}

export type ProductSelectedType = {
  value: number
  label: string
  media: {
    extendType: string
    filesize: number
    format: string
    mimeType: string
    url: string
  }
}

export const ProductProviders = ['shopify', 'woocommerce'] as const
export type ProductProvidersType = typeof ProductProviders[number]

export type ShopComponentType = {
  provider: ProductProvidersType
  productId: string
  variantId: string
  productItems: Array<ProductSelectedType>
  productItemId: string
  mediaOverride: string
}

export const ShopComponent = createMappedComponent<ShopComponentType>('ShopComponent')

export const SCENE_COMPONENT_SHOP = 'e-commerce-shop'
export const SCENE_COMPONENT_SHOP_DEFAULT_VALUES = {
  provider: 'shopify',
  products: [],
  productId: '',
  variantId: '',
  productItems: [],
  productItemId: '',
  mediaOverride: ''
} as ShopComponentType
