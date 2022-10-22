import { entityExists } from 'bitecs'

import { EngineActions } from '@xrengine/engine/src/ecs/classes/EngineState'
import { Entity } from '@xrengine/engine/src/ecs/classes/Entity'
import { World } from '@xrengine/engine/src/ecs/classes/World'
import { defineQuery, getComponent, hasComponent } from '@xrengine/engine/src/ecs/functions/ComponentFunctions'
import { InteractState } from '@xrengine/engine/src/interaction/systems/InteractiveSystem'
import { TransformComponent } from '@xrengine/engine/src/transform/components/TransformComponent'
import { createActionQueue, dispatchAction, getState } from '@xrengine/hyperflux'

import { createProductInteractUI, updateInteractUI } from './interactable/interactUI'
import { ProductComponent } from './ProductComponent'
import { CartActions } from './ShopifyCartService'
import { isMobile } from '@xrengine/engine/src/common/functions/isMobile'
import { ShopComponent } from './ShopComponent'
import { updateShop } from './ShopFunctions'
import { XRUIComponent } from '@xrengine/engine/src/xrui/components/XRUIComponent'
import { BaseInput } from '@xrengine/engine/src/input/enums/BaseInput'

type ProductUI = ReturnType<typeof createProductInteractUI>

export const maxPoolSize = isMobile ? 1 : 2

export default async function ProductSystem(world: World) {
  const interactActionQueue = createActionQueue(EngineActions.interactedWithObject.matches)
  const buttonClickedQueue = createActionQueue(EngineActions.buttonClicked.matches)
  const modifyPropertyActionQueue = createActionQueue(EngineActions.sceneObjectUpdate.matches)

  const productQuery = defineQuery([ProductComponent])
  const shopQuery = defineQuery([ShopComponent])

  const activeUIPool: Array<ProductUI> = []
  const inactiveUIPool: Array<ProductUI> = []
  const productToXRUIMap: Map<Entity, ProductUI> = new Map()

  const execute = () => {

    for (const action of modifyPropertyActionQueue()) {
      for (const entity of action.entities) {
        if (hasComponent(entity, ShopComponent)) updateShop(entity)
      }
    }
    for (const entity of shopQuery.enter()) updateShop(entity)

    for (const _ of productQuery.enter()) {
      dispatchAction(CartActions.locationHasPurchasableItems({}))
    }

    for (const action of buttonClickedQueue()) {
      if (!action.clicked && action.button === BaseInput.PRIMARY)
        for (const ui of activeUIPool) {
          const layer = getComponent(ui.entity, XRUIComponent).container
          const hit = layer.hitTest(world.pointerScreenRaycaster.ray)
          if (ui.state.mode.value !== 'inactive' && !hit) ui.state.mode.set('inactive')
        }
    }

    const interactState = getState(InteractState)

    // update UI interactions
    const interacted = interactActionQueue()[0]
    const isInteracting = activeUIPool.find((ui) => ui.state.mode.value === 'interacting')

    for (const xrui of activeUIPool) {
      let currentMode = xrui.state.mode.value
      let nextMode = xrui.state.mode.value
      const productEntity = xrui.state.productEntity.value

      const isPrimary = interactState.available.value.indexOf(productEntity) === 0

      if (isPrimary && nextMode === 'inactive') nextMode = 'active'
      if (!isPrimary && nextMode === 'active') nextMode = 'inactive'

      if (interacted && interacted.targetEntity === productEntity) {
        if (isInteracting) {
          nextMode = 'active'
        } else {
          nextMode = currentMode === 'interacting' ? 'active' : 'interacting'
        }
      }

      if (interacted && interacted.targetEntity !== productEntity) {
        nextMode = 'inactive'
      }

      // move non-focussed interactable UIs to inactive pool when done transitioning
      if (
        xrui.state.mode.value === 'active' &&
        (!interactState.available.value.includes(productEntity) ||
          interactState.available.value.indexOf(productEntity) > maxPoolSize - 1)
      ) {
        nextMode = 'inactive'
      }

      if (
        !entityExists(world, productEntity) ||
        (!xrui.state.transitioning.value && xrui.state.mode.value === 'inactive' && nextMode === 'inactive')
      ) {
        inactiveUIPool.push(xrui)
        // continue
      }

      // update all active UIs; wrap in try/catch becomes sometimes expected elements are not ready after we updated to React 18
      try {
        updateInteractUI(xrui, nextMode)
      } catch(e) {
        console.log('------updateInteractUI 异常--------')
        console.log(e)
      }
    }

    // remove inactive UIs from active pool
    for (const xrui of inactiveUIPool) {
      if (activeUIPool.includes(xrui)) {
        productToXRUIMap.delete(xrui.state.productEntity.value)
        activeUIPool.splice(activeUIPool.indexOf(xrui), 1)
        const productTransform = getComponent(xrui.state.productEntity.value, TransformComponent)
        if (productTransform) {
          productTransform.position.copy(xrui.state.productAnchorTransform.position.value)
          productTransform.rotation.copy(xrui.state.productAnchorTransform.rotation.value)
          productTransform.scale.copy(xrui.state.productAnchorTransform.scale.value)
        }
      }
    }

    // activate UIs as needed
    for (const entity of interactState.available.value) {
      const product = getComponent(entity, ProductComponent)
      if (!product || !entityExists(world, entity)) continue
      if (productToXRUIMap.has(entity)) continue
      if (activeUIPool.length === maxPoolSize) break
      const ui = inactiveUIPool.pop() || createProductInteractUI(entity)
      const uiTransform = getComponent(ui.entity, TransformComponent)
      ui.state.productEntity.set(entity)
      ui.state.productData.set(getComponent(entity, ProductComponent))
      const productTransform = getComponent(entity, TransformComponent)
      ui.state.productAnchorTransform.position.value.copy(productTransform.position)
      ui.state.productAnchorTransform.rotation.value.copy(productTransform.rotation)
      ui.state.productAnchorTransform.scale.value.copy(productTransform.scale)
      uiTransform.position.copy(productTransform.position)
      uiTransform.rotation.copy(productTransform.rotation)
      uiTransform.scale.setScalar(1)
      ui.state.targetGroup.value.position.copy(productTransform.position)
      ui.state.targetGroup.value.quaternion.copy(productTransform.rotation)
      ui.state.targetGroup.value.scale.copy(productTransform.scale)
      productToXRUIMap.set(entity, ui)
      activeUIPool.push(ui)
    }
  }

  const cleanup = async () => {}

  return { execute, cleanup }
}
