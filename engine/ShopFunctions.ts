import {
  ComponentDeserializeFunction,
  ComponentUpdateFunction
} from '@xrengine/engine/src/common/constants/PrefabFunctionType'
import { Entity } from '@xrengine/engine/src/ecs/classes/Entity'
import {
  addComponent,
  getComponent,
  removeComponent
} from '@xrengine/engine/src/ecs/functions/ComponentFunctions'
import {
  deserializeImage,
} from '@xrengine/engine/src/scene/functions/loaders/ImageFunctions'
import {
  deserializeMedia,
} from '@xrengine/engine/src/scene/functions/loaders/MediaFunctions'
import {
  deserializeModel,
} from '@xrengine/engine/src/scene/functions/loaders/ModelFunctions'
import {
  deserializeVideo,
} from '@xrengine/engine/src/scene/functions/loaders/VideoFunctions'

import { getShopifyData } from '../editor/getShopifyData'
import { getWoocommerceData } from '../editor/getWoocommerceData'
import { ProductComponentType } from './ProductComponent'
import { deserializeProduct } from './ProductFunctions'
import {
  ProductProvidersType,
  ProductSelectedType,
  ProductType,
  SCENE_COMPONENT_SHOP_DEFAULT_VALUES,
  ShopComponent,
  ShopComponentType
} from './ShopComponent'

const providers = {
  shopify: getShopifyData,
  woocommerce: getWoocommerceData
} as Record<ProductProvidersType, (entity: Entity) => Promise<ProductType[]>>

export const Products = {
  shopify: [] as ProductType[],
  woocommerce: [] as ProductType[]
}

export const fetchProducts = () => {
  for (const provider of Object.keys(providers)) {
    providers[provider]().then((products) => {
      Products[provider] = products
    })
  }
}

export const deserializeShop: ComponentDeserializeFunction = (
  entity: Entity,
  data: ShopComponentType
) => {
  const props = parseProductProperties(data)
  addComponent(entity, ShopComponent, props)
}

export const updateShop: ComponentUpdateFunction = async (entity: Entity) => {
  const component = getComponent(entity, ShopComponent)
  if (component.productId && Products[component.provider]?.length) {
    const product = Products[component.provider].find((product) => product.id == component.productId)
    component.productItems = product?.media?.map((media, index) => {
      return { value: index, label: media.url.split('/').pop().split('?')[0], media }
    })
  }
}

export const getProductDetails = (entity: Entity) => {
  const component = getComponent(entity, ShopComponent)
  const productComponent: ProductComponentType = {} as any
  component.productItems = []

  if (component.productId && Products[component.provider]?.length) {
    const product = Products[component.provider].find((product) => product.id === component.productId)!
    productComponent.url = product.storeUrl
    productComponent.description = product.description
    productComponent.media = product.media.map((media) => media.url)
    const variant = product.variants.find((variant) => variant.id === component.variantId)!
    productComponent.productId = product.id
    productComponent.variantId = variant.id
    productComponent.title = product.title
    productComponent.price = variant.priceV2.amount
    productComponent.currencyCode = variant.priceV2.currencyCode
  }

  return productComponent
}

export const loadProduct = async (entity: Entity) => {
  const productComponent = getComponent(entity, ShopComponent)
  const item = productComponent.productItems[productComponent.productItemId] as ProductSelectedType
  if (productComponent.mediaOverride) {
    deserializeModel(entity, { src: productComponent.mediaOverride })
    deserializeProduct(entity, getProductDetails(entity))
  } else {
    if (productComponent.productItems.length) {
      switch (item.media.extendType) {
        case 'model':
          deserializeModel(entity, { src: item.media.url })
          deserializeProduct(entity, getProductDetails(entity))
          break
        case 'image':
          deserializeImage(entity, { imageSource: item.media.url })
          deserializeProduct(entity, getProductDetails(entity))
          break
        case 'video':
          deserializeMedia(entity, {})
          deserializeImage(entity, {})
          deserializeVideo(entity, { videoSource: item.media.url })
          deserializeProduct(entity, getProductDetails(entity))
          break
      }
    }
  }

  removeComponent(entity, ShopComponent)
}

const parseProductProperties = (props: Partial<ShopComponentType>): ShopComponentType => {
  return {
    ...SCENE_COMPONENT_SHOP_DEFAULT_VALUES,
    ...props
  }
}
