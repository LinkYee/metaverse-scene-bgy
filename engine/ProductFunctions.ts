import { ComponentDeserializeFunction } from '@xrengine/engine/src/common/constants/PrefabFunctionType'
import { Entity } from '@xrengine/engine/src/ecs/classes/Entity'
import { setComponent } from '@xrengine/engine/src/ecs/functions/ComponentFunctions'
import { setBoundingBoxComponent } from '@xrengine/engine/src/interaction/components/BoundingBoxComponents'
import { setInteractableComponent } from '@xrengine/engine/src/interaction/components/InteractableComponent'

import { ProductComponent, ProductComponentType } from './ProductComponent'

export const deserializeProduct: ComponentDeserializeFunction = (
  entity: Entity,
  data: ProductComponentType
) => {
  setComponent(entity, ProductComponent, { ...data })
  setInteractableComponent(entity)
  setBoundingBoxComponent(entity)
}
