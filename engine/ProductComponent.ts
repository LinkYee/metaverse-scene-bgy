import { createMappedComponent } from '@xrengine/engine/src/ecs/functions/ComponentFunctions'

export type ProductComponentType = {
  url: string
  media: string[]
  productId: string
  variantId: string
  description: string
  title: string
  price: number
  currencyCode: string
}

export const ProductComponent = createMappedComponent<ProductComponentType>('ProductComponent')

export const SCENE_COMPONENT_PRODUCT = 'e-commerce-product'
export const SCENE_COMPONENT_PRODUCT_DEFAULT_VALUES = {
  url: '',
  media: [],
  productId: '',
  variantId: '',
  description: '',
  title: '',
  price: 0,
  currencyCode: '',
  interacted: false
} as ProductComponentType
