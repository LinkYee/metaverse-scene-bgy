import { EntityNodeEditor, prefabIcons } from '@xrengine/editor/src/functions/PrefabEditors'
import { SelectionAction } from '@xrengine/editor/src/services/SelectionServices'
import { Engine } from '@xrengine/engine/src/ecs/classes/Engine'
import { World } from '@xrengine/engine/src/ecs/classes/World'
import { initSystems } from '@xrengine/engine/src/ecs/functions/SystemFunctions'
import { SystemUpdateType } from '@xrengine/engine/src/ecs/functions/SystemUpdateType'
import { dispatchAction } from '@xrengine/hyperflux'

import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart'
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart'

import ProductNodeEditor from '../editor/ProductNodeEditor'
import ShopNodeEditor from '../editor/ShopNodeEditor'
import { CartService } from '../engine/ShopifyCartService'
import {
  deserializeProduct,
} from './ProductFunctions'
import {
  deserializeShop,
  fetchProducts,
} from './ShopFunctions'
import { SCENE_COMPONENT_SHOP, SCENE_COMPONENT_SHOP_DEFAULT_VALUES, ShopComponent } from './ShopComponent'
import { ProductComponent, SCENE_COMPONENT_PRODUCT, SCENE_COMPONENT_PRODUCT_DEFAULT_VALUES } from './ProductComponent'
import { defaultSpatialComponents } from '@xrengine/engine/src/scene/systems/SceneObjectUpdateSystem'

export const product = 'e-commerce Product' as const
export const shop = 'e-commerce Shop' as const

export default async function (world: World) {
  prefabIcons[shop] = ShoppingCartIcon
  prefabIcons[product] = AddShoppingCartIcon
  EntityNodeEditor.set(ShopComponent, ShopNodeEditor)
  EntityNodeEditor.set(ProductComponent, ProductNodeEditor)

  world.sceneComponentRegistry.set(ShopComponent.name, SCENE_COMPONENT_SHOP)
  world.scenePrefabRegistry.set(shop, [
    ...defaultSpatialComponents,
    { name: SCENE_COMPONENT_SHOP, props: SCENE_COMPONENT_SHOP_DEFAULT_VALUES }
  ])

  world.sceneComponentRegistry.set(ProductComponent.name, SCENE_COMPONENT_PRODUCT)
  world.scenePrefabRegistry.set(product, [
    ...defaultSpatialComponents,
    { name: SCENE_COMPONENT_PRODUCT, props: SCENE_COMPONENT_PRODUCT_DEFAULT_VALUES }
  ])

  world.sceneLoadingRegistry.set(SCENE_COMPONENT_SHOP, {
    deserialize: deserializeShop,
    serialize: () => undefined, // intentionally not save anything, as we dont want to leak sensitive data
  })

  world.sceneLoadingRegistry.set(SCENE_COMPONENT_PRODUCT, {
    deserialize: deserializeProduct
  })
  try {
    await initSystems(world, [
      {
        uuid: 'ethereal.ecommerce.Product',
        systemLoader: () => import('./ProductSystem'),
        type: SystemUpdateType.UPDATE_LATE
      }
    ])
  } catch (e) {
    console.log(e)
    debugger
  }

  if (Engine.instance.isEditor) {
    await fetchProducts()
    dispatchAction(SelectionAction.changedSceneGraph({}))
  } else {
    CartService.createCart()
  }
}
