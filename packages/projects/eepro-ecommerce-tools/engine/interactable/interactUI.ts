import {
  AxesHelper,
  BufferGeometry,
  Color,
  DoubleSide,
  MathUtils,
  Mesh,
  MeshBasicMaterial,
  MeshPhongMaterial,
  MeshPhysicalMaterial,
  Quaternion,
  Vector2,
  Vector3
} from 'three'

import { Engine } from '@xrengine/engine/src/ecs/classes/Engine'
import { Entity } from '@xrengine/engine/src/ecs/classes/Entity'
import { addComponent, getComponent, hasComponent, setComponent } from '@xrengine/engine/src/ecs/functions/ComponentFunctions'
import { BoundingBoxComponent, setBoundingBoxComponent } from '@xrengine/engine/src/interaction/components/BoundingBoxComponents'
import { NameComponent } from '@xrengine/engine/src/scene/components/NameComponent'
import { Object3DComponent } from '@xrengine/engine/src/scene/components/Object3DComponent'
import { TransformComponent } from '@xrengine/engine/src/transform/components/TransformComponent'
import { ObjectFitFunctions } from '@xrengine/engine/src/xrui/functions/ObjectFitFunctions'

import { createProductModalView } from './EcommerceInteractableModalView'
import { entityExists } from '@xrengine/engine/src/ecs/functions/EntityFunctions'
import { EngineRenderer } from '@xrengine/engine/src/renderer/WebGLRendererSystem'

const MODEL_SCALE_INACTIVE = 1
const MODEL_SCALE_ACTIVE = 1.2
const MODEL_ELEVATION_ACTIVE = 0.3

const TITLE_POS_INACTIVE = new Vector3(0, 0.4, 0)
const TITLE_POS_ACTIVE = new Vector3(0, 0.3, 0.3)

const INTERACTING_UI_POSITION = new Vector3(0, 0, -0.01)
const INTERACTING_CAMERA_ROTATION = new Quaternion()

const SCREEN_SIZE = new Vector2

const INACTIVE_TRANSITION_DURATION = 1
const ACTIVE_TRANSITION_DURATION = 4

const _vect = new Vector3()
const _quat = new Quaternion()

let _uiCount = 0

export function createProductInteractUI(modelEntity: Entity) {
  _uiCount++

  const ui = createProductModalView(modelEntity)

  addComponent(ui.entity, NameComponent, { name: `interact-ui-${_uiCount}` })

  return ui
}

export const updateInteractUI = (
  xrui: ReturnType<typeof createProductInteractUI>,
  nextMode: typeof xrui.state.mode.value
) => {
  const productEntity = xrui.state.productEntity.value
  const currentMode = xrui.state.mode.value

  const world = Engine.instance.currentWorld
  const uiContainer = xrui.container

  if (!entityExists(productEntity)) return

  if (!uiContainer) return

  // TODO: find a better pattern for this
  uiContainer.rootLayer.traverseLayersPreOrder((layer) => {
    layer.shouldApplyDOMLayout = false
    // const mat = layer.contentMesh.material as MeshBasicMaterial
    // mat.opacity = 0
  })

  // if (!isMobile) {
  //   xrui.container.rootLayer.traverseLayersPreOrder((layer) => {
  //     const mat = layer.contentMesh.material as MeshPhysicalMaterial
  //     if (mat.emissiveMap !== mat.map) {
  //       mat.emissive = new Color('white')
  //       mat.emissiveMap = mat.map
  //       mat.emissiveIntensity = 0.7
  //       mat.needsUpdate = true
  //     }
  //   })
  // }

  const anchorPosition = xrui.state.productAnchorTransform.value.position
  const anchorRotation = xrui.state.productAnchorTransform.value.rotation
  const anchorScale = xrui.state.productAnchorTransform.value.scale
  const modelTargetGroup = xrui.state.targetGroup.value
  const productModelComponent = getComponent(productEntity, Object3DComponent)

  if (!hasComponent(productEntity, BoundingBoxComponent)) setBoundingBoxComponent(productEntity)

  if (nextMode !== currentMode) {
    xrui.state.transitioning.set(true)
    xrui.state.transitionStartTime.set(world.elapsedSeconds)
    xrui.state.mode.set(nextMode)
    if (nextMode === 'interacting') {
      world.camera.attach(uiContainer)
    } else {
      world.scene.attach(uiContainer)
    }
    productModelComponent?.value.traverse((obj) => {
      const mesh = obj as Mesh<BufferGeometry, MeshBasicMaterial>
      if (mesh.material) {
        mesh.material.transparent = nextMode === 'interacting'
        mesh.renderOrder = nextMode === 'interacting' ? 1 : 0
        mesh.material.needsUpdate = true
      }
    })
  }

  const transitionStart = xrui.state.transitionStartTime.value
  const transitionElapsed = transitionStart ? world.elapsedSeconds - transitionStart : 1


  const duration = currentMode === 'inactive' ? INACTIVE_TRANSITION_DURATION : ACTIVE_TRANSITION_DURATION
  const alpha = Math.min(transitionElapsed / duration, 1)

  if (alpha >= 1) {
    xrui.state.transitioning.set(false)
  }

  const root = uiContainer.rootLayer
  const rootMat = root.contentMesh.material as MeshBasicMaterial

  const title = uiContainer.rootLayer.querySelector('.title')!
  const titleMat = title.contentMesh.material as MeshBasicMaterial
  // const titleText = uiContainer.rootLayer.querySelector('.title-text')!
  // const titleTextMat = titleText.contentMesh.material as MeshBasicMaterial

  const interactHint = uiContainer.rootLayer.querySelector('.hint')!
  const interactHintMat = interactHint.contentMesh.material as MeshBasicMaterial

  const description = uiContainer.rootLayer.querySelector('.description')!
  // const price = uiContainer.rootLayer.querySelector('.price')!
  const descriptionMat = description.contentMesh.material as MeshBasicMaterial
  // const priceMat = price.contentMesh.material as MeshBasicMaterial
  //
  // const stars = [
  //   uiContainer.rootLayer.querySelector('.star-1')!,
  //   uiContainer.rootLayer.querySelector('.star-2')!,
  //   uiContainer.rootLayer.querySelector('.star-3')!,
  //   uiContainer.rootLayer.querySelector('.star-4')!,
  //   uiContainer.rootLayer.querySelector('.star-5')!
  // ]

  // const modelDivLayer = uiContainer.rootLayer.querySelector('.model')!
  // modelDivLayer.position.lerp(modelDivLayer.domLayout.position, alpha)
  // modelDivLayer.quaternion.slerp(modelDivLayer.domLayout.quaternion, alpha)
  // modelDivLayer.scale.lerp(modelDivLayer.domLayout.scale, alpha)

  const link = uiContainer.rootLayer.querySelector('.link')!
  // const linkCart = uiContainer.rootLayer.querySelector('.link-cart')!
  const linkMat = link.contentMesh.material as MeshBasicMaterial
  // const linkCartMat = linkCart.contentMesh.material as MeshBasicMaterial

  const cameraTransform = getComponent(Engine.instance.currentWorld.cameraEntity, TransformComponent)

  if (nextMode === 'inactive') {
    const uiContainerScale = Math.max(1, cameraTransform.position.distanceTo(anchorPosition)) * 0.8
    uiContainer.position.lerp(anchorPosition, alpha)
    uiContainer.quaternion.copy(cameraTransform.rotation)
    uiContainer.scale.lerp(_vect.setScalar(uiContainerScale), alpha)

    if (modelTargetGroup.parent !== world.scene) {
      world.scene.attach(modelTargetGroup)
    }

    modelTargetGroup.position.lerp(anchorPosition, alpha)
    modelTargetGroup.quaternion.slerp(anchorRotation, alpha)
    modelTargetGroup.scale.lerp(_vect.copy(anchorScale).multiplyScalar(MODEL_SCALE_INACTIVE), alpha)

    rootMat.opacity = MathUtils.lerp(rootMat.opacity, 0, alpha)

    title.position.lerp(TITLE_POS_INACTIVE, alpha)
    title.scale.lerp(title.domLayout.scale, alpha)
    titleMat.opacity = MathUtils.lerp(titleMat.opacity, 0, alpha)
    interactHint.position.copy(title.position)
    interactHint.position.y -= 0.1
    interactHintMat.opacity = MathUtils.lerp(interactHintMat.opacity, 0, alpha)

    description.position.lerp(description.domLayout.position, alpha)
    // price.position.lerp(price.domLayout.position, alpha)
    descriptionMat.opacity = MathUtils.lerp(descriptionMat.opacity, 0, alpha)
    // priceMat.opacity = MathUtils.lerp(priceMat.opacity, 0, alpha)

    link.position.lerp(link.domLayout.position, alpha)
    link.scale.lerp(link.domLayout.scale.multiplyScalar(0.1), alpha)
    // linkCart.position.lerp(linkCart.domLayout.position, alpha)
    // linkCart.scale.lerp(linkCart.domLayout.scale.multiplyScalar(0.1), alpha)
    linkMat.opacity = MathUtils.lerp(linkMat.opacity, 0, alpha)
    // linkCartMat.opacity = MathUtils.lerp(linkCartMat.opacity, 0, alpha)

    // for (const [i, s] of stars.entries()) {
    //   s.position.lerp(s.domLayout.position, alpha)
    //   s.scale.lerp(s.domLayout.scale.multiplyScalar(0.1), alpha)
    //   const mat = s.contentMesh.material as MeshBasicMaterial
    //   mat.opacity = MathUtils.lerp(mat.opacity, 0, alpha)
    // }
  } else if (nextMode === 'active') {


    if (modelTargetGroup.parent !== world.scene) {
      world.scene.attach(modelTargetGroup)
    }

    const uiContainerScale = Math.max(1, cameraTransform.position.distanceTo(anchorPosition)) * 0.8
    uiContainer.position.lerp(anchorPosition, alpha)
    uiContainer.quaternion.copy(cameraTransform.rotation)
    uiContainer.scale.lerp(_vect.setScalar(uiContainerScale), alpha)

    title.position.lerp(TITLE_POS_ACTIVE, alpha)
    interactHint.position.y += 1
    title.scale.lerp(title.domLayout.scale, alpha)
    titleMat.opacity = MathUtils.lerp(titleMat.opacity, 1, alpha)
    interactHint.position.copy(title.position)
    interactHint.position.y -= 0.15
    interactHintMat.opacity = MathUtils.lerp(interactHintMat.opacity, 1, alpha)
    // title.position.lerp(TITLE_POS_ACTIVE, alpha)

    const modelTargetPosition = _vect.copy(anchorPosition)
    modelTargetPosition.y += MODEL_ELEVATION_ACTIVE + Math.sin(world.elapsedSeconds) * 0.05
    modelTargetGroup.position.lerp(modelTargetPosition, alpha)
    modelTargetGroup.quaternion.slerp(anchorRotation, alpha)
    modelTargetGroup.scale.lerp(_vect.copy(anchorScale).multiplyScalar(MODEL_SCALE_ACTIVE), alpha)

    rootMat.opacity = MathUtils.lerp(rootMat.opacity, 0, alpha)

    description.position.lerp(description.domLayout.position, alpha)
    // price.position.lerp(price.domLayout.position, alpha)
    descriptionMat.opacity = MathUtils.lerp(descriptionMat.opacity, 0, alpha)
    // priceMat.opacity = MathUtils.lerp(priceMat.opacity, 0, alpha)

    link.position.lerp(link.domLayout.position, alpha)
    link.scale.lerp(link.domLayout.scale.multiplyScalar(0.1), alpha)
    // linkCart.position.lerp(linkCart.domLayout.position, alpha)
    // linkCart.scale.lerp(linkCart.domLayout.scale.multiplyScalar(0.1), alpha)
    linkMat.opacity = MathUtils.lerp(linkMat.opacity, 0, alpha)
    // linkCartMat.opacity = MathUtils.lerp(linkCartMat.opacity, 0, alpha)

    // for (const [i, s] of stars.entries()) {
    //   s.position.lerp(s.domLayout.position, alpha)
    //   s.scale.lerp(s.domLayout.scale.multiplyScalar(0.1), alpha)
    //   const mat = s.contentMesh.material as MeshBasicMaterial
    //   mat.opacity = MathUtils.lerp(mat.opacity, 0, alpha)
    // }
  } else if (nextMode === 'interacting') {
    const uiSize = uiContainer.rootLayer.domSize

    const screenSize = EngineRenderer.instance.renderer.getSize(SCREEN_SIZE)
    const scaleMultiplier = (screenSize.width > 400) ? Math.min(700 / screenSize.width, 0.70) : 0.85

    const uiContainerScale =
      ObjectFitFunctions.computeContentFitScaleForCamera(INTERACTING_UI_POSITION.z, uiSize.x, uiSize.y, 'contain') *
      scaleMultiplier
    uiContainer.position.lerp(INTERACTING_UI_POSITION, alpha)
    uiContainer.quaternion.slerp(INTERACTING_CAMERA_ROTATION, alpha)
    uiContainer.scale.lerp(_vect.setScalar(uiContainerScale), alpha)

    // const modelBounds = getComponent(productEntity, BoundingBoxComponent)
    // const modelSize = modelBounds.box.getSize(_vect)
    // const modelScale =
    //   ObjectFitFunctions.computeContentFitScale(
    //     modelSize.x,
    //     modelSize.y,
    //     modelDivLayer.domSize.x,
    //     modelDivLayer.domSize.y,
    //     'contain'
    //   ) * 0.5
    //
    // if (modelTargetGroup.parent !== modelDivLayer) {
    //   modelDivLayer.attach(modelTargetGroup)
    // }

    // modelTargetGroup.position.lerp(_vect.setScalar(0), alpha)
    // modelTargetGroup.quaternion.slerp(_quat.copy(world.camera.quaternion).invert(), alpha)
    // modelTargetGroup.scale.lerp(_vect.setScalar(modelScale), alpha)

    rootMat.opacity = MathUtils.lerp(rootMat.opacity, 1, alpha)

    const mpp = 1 / xrui.container.manager.pixelsPerMeter
    title.position.lerp(title.domLayout.position, alpha)
    title.scale.lerp(_vect.copy(title.domLayout.scale).multiplyScalar(0.99), alpha)
    // title.scale.lerp(interactHint.domLayout.position, alpha)
    titleMat.opacity = MathUtils.lerp(titleMat.opacity, 1, alpha)
    interactHint.position.lerp(interactHint.domLayout.position, alpha)
    interactHintMat.opacity = MathUtils.lerp(interactHintMat.opacity, 0, alpha)

    const descriptionAlpha = Math.min((transitionElapsed - 0.2) / (duration * 3), 1)
    description.position.lerp(description.domLayout.position, descriptionAlpha)
    descriptionMat.opacity = MathUtils.lerp(descriptionMat.opacity, 1, descriptionAlpha)

    // const priceAlpha = Math.min((transitionElapsed - 0.3) / (duration * 3), 1)
    // price.position.lerp(price.domLayout.position, priceAlpha)
    // priceMat.opacity = MathUtils.lerp(priceMat.opacity, 1, priceAlpha)

    const linkAlpha = Math.min((transitionElapsed - 0.3) / (duration * 3), 1)
    const linkAlpha2 = Math.min((transitionElapsed - 0.4) / (duration * 3), 1)
    link.position.lerp(link.domLayout.position, linkAlpha)
    link.scale.lerp(link.domLayout.scale, linkAlpha)
    linkMat.opacity = MathUtils.lerp(linkMat.opacity, 1, linkAlpha)
    // linkCart.position.lerp(linkCart.domLayout.position, linkAlpha2)
    // linkCart.scale.lerp(linkCart.domLayout.scale, linkAlpha2)
    // linkCartMat.opacity = MathUtils.lerp(linkCartMat.opacity, 1, linkAlpha2)
    //
    // for (const [i, s] of stars.entries()) {
    //   const alpha = Math.min((transitionElapsed - i * 0.1) / (duration * 3), 1)
    //   s.position.lerp(s.domLayout.position, alpha)
    //   s.scale.lerp(s.domLayout.scale, alpha)
    //   const mat = s.contentMesh.material as MeshBasicMaterial
    //   mat.opacity = MathUtils.lerp(mat.opacity, 1, alpha)
    // }
  }

  const productTransform = getComponent(productEntity, TransformComponent)
  if (productTransform) {
    modelTargetGroup.updateMatrix()
    modelTargetGroup.updateWorldMatrix(true, true)
    modelTargetGroup.getWorldPosition(productTransform.position)
    modelTargetGroup.getWorldQuaternion(productTransform.rotation)
    modelTargetGroup.getWorldScale(productTransform.scale)
    productModelComponent?.value.updateMatrix()
    productModelComponent?.value.updateWorldMatrix(true, true)
  }
}
