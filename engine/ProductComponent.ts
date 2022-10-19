import { createMappedComponent } from '@xrengine/engine/src/ecs/functions/ComponentFunctions'

export type ProductComponentType = {
  mediaUrl: string;
  type: string;
  url: string
  media: string[]
  productId: string
  variantId: string
  description: string
  title: string
  price: number
  currencyCode: string
  rotateStatus: boolean
  endTime: number
  resultId: string
  resultName: string
  guideStatus: boolean
  congbaArr: object[]
  curIndex: number,
  congbaStatus: boolean
}

export const ProductComponent = createMappedComponent<ProductComponentType>('ProductComponent')

export const SCENE_COMPONENT_PRODUCT = 'e-commerce-product'
export const SCENE_COMPONENT_PRODUCT_DEFAULT_VALUES = {
  mediaUrl: '',
  type: '',
  url: '',
  media: [],
  productId: '',
  variantId: '',
  description: '',
  title: '',
  price: 0,
  currencyCode: '',
  endTime: 0,
  interacted: false,
  rotateStatus: false,
  resultId: '',
  resultName: '',
  guideStatus: false,
  congbaArr: [],
  curIndex: 0,
  congbaStatus: false
} as ProductComponentType
