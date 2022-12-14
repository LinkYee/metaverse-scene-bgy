import {
  AxesHelper,
  BufferGeometry,
  Color,
  DoubleSide, Group, Layers,
  MathUtils,
  Mesh,
  MeshBasicMaterial,
  MeshPhongMaterial,
  MeshPhysicalMaterial,
  Quaternion, Scene,
  Vector2,
  Vector3
} from 'three'
import Axios, {
  AxiosRequestConfig,
  AxiosResponse,
  AxiosError,
  AxiosInstance,
} from "axios";
import {AudioEffectPlayer} from '@xrengine/engine/src/audio/systems/MediaSystem'
import {Engine} from '@xrengine/engine/src/ecs/classes/Engine'
import {Entity} from '@xrengine/engine/src/ecs/classes/Entity'
import {
  addComponent,
  defineQuery,
  getComponent,
  hasComponent,
  setComponent
} from '@xrengine/engine/src/ecs/functions/ComponentFunctions'
import {addEntityNodeChild, createEntityNode} from '@xrengine/engine/src/ecs/functions/EntityTree'
import {
  BoundingBoxComponent,
  setBoundingBoxComponent
} from '@xrengine/engine/src/interaction/components/BoundingBoxComponents'
import {NameComponent} from '@xrengine/engine/src/scene/components/NameComponent'
import {Object3DComponent} from '@xrengine/engine/src/scene/components/Object3DComponent'
import {
  setLocalTransformComponent,
  TransformComponent
} from '@xrengine/engine/src/transform/components/TransformComponent'
import {ObjectFitFunctions} from '@xrengine/engine/src/xrui/functions/ObjectFitFunctions'

import {createProductModalView} from './EcommerceInteractableModalView'
import {createEntity, entityExists} from '@xrengine/engine/src/ecs/functions/EntityFunctions'
import {EngineRenderer} from '@xrengine/engine/src/renderer/WebGLRendererSystem'
import {NotificationService} from "@xrengine/client-core/src/common/services/NotificationService";
import {ModelComponent} from "@xrengine/engine/src/scene/components/ModelComponent";
import {addObjectToGroup, GroupComponent} from "@xrengine/engine/src/scene/components/GroupComponent";
import {parseGLTFModel} from "@xrengine/engine/src/scene/functions/loadGLTFModel";
import {ObjectLayers} from "@xrengine/engine/src/scene/constants/ObjectLayers";
import {MediaComponent, MediaElementComponent} from "@xrengine/engine/src/scene/components/MediaComponent";
import obj3dFromUuid from "@xrengine/engine/src/scene/util/obj3dFromUuid";
import {PortalComponent} from "@xrengine/engine/src/scene/components/PortalComponent";
import {setVisibleComponent} from "@xrengine/engine/src/scene/components/VisibleComponent";
import {ProductComponent} from '../ProductComponent'
import {changeAvatarAnimationState} from '@xrengine/engine/src/avatar/animation/AvatarAnimationGraph'
import {AvatarStates} from '@xrengine/engine/src/avatar/animation/Util'
import {ImageComponent} from "@xrengine/engine/src/scene/components/ImageComponent";

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

const LUCKY_ROTATE_DURATION = 3 // ????????????????????????
const PRIZE_SHOW_DURATION = 10 // ????????????????????????
const PORTAL_IN_ID = 'dd1eafe4-dc87-4353-b3ae-567d4f81c032' // ???????????????id
const PORTAL_OUT_ID = '2d7f9f97-20a0-40e8-a504-682f650af501' // ???????????????id
let LAST_VIDEO_STATUS_FLIP_TIME = 0;
const _vect = new Vector3()
const _quat = new Quaternion()
let congbaPlayer = null
let guideTimer;
let guideTimerCounter = 0;
let _uiCount = 0
var resultImg = ''
let bgmPaused = false
let voteState = 0 // 0 ????????? 1 ????????? 2 ???????????? 3 ???????????? 4 ???????????????

const soundEffect = new Audio();
soundEffect.autoplay = false;
let actionCoolingTime = new Date().getTime()
function coolingTimeCheck(minTime){
  var timeDiff = new Date().getTime() - actionCoolingTime
  minTime = minTime ? minTime : 500
  if(timeDiff < minTime){
    return false
  }
  actionCoolingTime = new Date().getTime()
  return true
}

export function createProductInteractUI(modelEntity: Entity) {
  _uiCount++

  const ui = createProductModalView(modelEntity)

  addComponent(ui.entity, NameComponent, {name: `interact-ui-${_uiCount}`})

  return ui
}


function getUserDevice() {
  var isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  if (isIOS){
    return 'ios'
  } else{
    return 'android'
  }
}

function playVideo() {
  if(!coolingTimeCheck(500)){
    return
  }
  var allNodes = document.querySelectorAll('[id^=container-xrui-]');
  allNodes.forEach(singleNode => { 
    if(singleNode && singleNode.shadowRoot){
      let video = singleNode.shadowRoot.getElementById('productVideo');
      video && video.setAttribute('poster', video.currentSrc + "?x-oss-process=video/snapshot,t_100,f_jpg,w_640,h_360,m_fast")
      if(getUserDevice() != 'ios'){
        video && video.play(); 
      }
    }
  })
}

function pauseVideo() {
  if(!coolingTimeCheck(500)){
    return
  }
  var allNodes = document.querySelectorAll('[id^=container-xrui-]');
  allNodes.forEach(singleNode => { 
    if(singleNode && singleNode.shadowRoot){
      let video = singleNode.shadowRoot.getElementById('productVideo');
      video && video.pause(); 
    }
  })
}

function pauseBGM() {
  if(!coolingTimeCheck(1000)){
    return
  }
  const mediaQuery = defineQuery([MediaComponent, MediaElementComponent])
  for (const entity of mediaQuery()) {
    const media = getComponent(entity, MediaComponent)
    const mediaEle = getComponent(entity, MediaElementComponent)?.element
    // console.log(media)
    // debugger
    if (media.playing.value) {
      media.playing.set(false)
    }
    mediaEle.pause()
  }
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
  const descriptionMat = description.contentMesh.material as MeshBasicMaterial

  // const modelDivLayer = uiContainer.rootLayer.querySelector('.model')!
  // modelDivLayer.position.lerp(modelDivLayer.domLayout.position, alpha)
  // modelDivLayer.quaternion.slerp(modelDivLayer.domLayout.quaternion, alpha)
  // modelDivLayer.scale.lerp(modelDivLayer.domLayout.scale, alpha)

  const link = uiContainer.rootLayer.querySelector('.link')!
  const linkMat = link.contentMesh.material as MeshBasicMaterial

  const cameraTransform = getComponent(Engine.instance.currentWorld.cameraEntity, TransformComponent)

  if (nextMode === 'inactive') {
    // ??????????????????
    // const ctlBox = document.getElementById('ctrlBox')
    // const userMenuBox = document.getElementById('userMenuBox')
    // if(ctlBox){
    //   ctlBox.style.display = 'block'
    // }
   
    // userMenuBox.style.display = 'block'
    if (xrui.state.productData.type.value === 'video') {
      // ??????????????? ??????
      pauseVideo()
    }
    // ???????????????????????????
    // if (xrui.state.productData.type.value === 'congba') {
    //   if(congbaPlayer){
    //     console.log('congbaPlayer.pause()')
    //     congbaPlayer.pause()
    //     congbaPlayer = null
    //     xrui.state.productData.congbaStatus.set(false)
    //   }
    // }
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
    // ???????????????
    interactHint.position.y += 0.3
    interactHintMat.opacity = MathUtils.lerp(interactHintMat.opacity, 0, alpha)

    description.position.lerp(description.domLayout.position, alpha)
    descriptionMat.opacity = MathUtils.lerp(descriptionMat.opacity, 0, alpha)

    link.position.lerp(link.domLayout.position, alpha)
    link.scale.lerp(link.domLayout.scale.multiplyScalar(0.1), alpha)
    linkMat.opacity = MathUtils.lerp(linkMat.opacity, 0, alpha)
  } else if (nextMode === 'active') {
    // const ctlBox = document.getElementById('ctrlBox')
    // const userMenuBox = document.getElementById('userMenuBox')
    // ctlBox.style.display = 'block'
    // userMenuBox.style.display = 'block'
    if (xrui.state.productData.type.value === 'video') {
      // ??????????????? ??????
      pauseVideo() 
    }
    // ???????????????????????????
    // if (xrui.state.productData.type.value === 'card') return;
    if (modelTargetGroup.parent !== world.scene) {
      world.scene.attach(modelTargetGroup)
    }
    // ???????????????????????????
    // if (xrui.state.productData.type.value === 'congba') {
    //   if(congbaPlayer){
    //     console.log('congbaPlayer.pause()')
    //     congbaPlayer.pause()
    //     congbaPlayer = null
    //     xrui.state.productData.congbaStatus.set(false)
    //   }
    // }


    const uiContainerScale = Math.max(1, cameraTransform.position.distanceTo(anchorPosition)) * 0.8
    uiContainer.position.lerp(anchorPosition, alpha)
    uiContainer.quaternion.copy(cameraTransform.rotation)
    uiContainer.scale.lerp(_vect.setScalar(uiContainerScale), alpha)
    title.position.lerp(TITLE_POS_ACTIVE, alpha)
    interactHint.position.y += 1
    title.scale.lerp(title.domLayout.scale, alpha)
    titleMat.opacity = MathUtils.lerp(titleMat.opacity, 1, alpha)
    interactHint.position.copy(title.position)
    interactHint.position.y += 0.3
    interactHintMat.opacity = MathUtils.lerp(interactHintMat.opacity, 1, alpha)
    const modelTargetPosition = _vect.copy(anchorPosition)
    modelTargetPosition.y += MODEL_ELEVATION_ACTIVE + Math.sin(world.elapsedSeconds) * 0.05
    modelTargetGroup.position.lerp(modelTargetPosition, alpha)
    modelTargetGroup.quaternion.slerp(anchorRotation, alpha)
    modelTargetGroup.scale.lerp(_vect.copy(anchorScale).multiplyScalar(MODEL_SCALE_ACTIVE), alpha)

    rootMat.opacity = MathUtils.lerp(rootMat.opacity, 0, alpha)

    description.position.lerp(description.domLayout.position, alpha)
    descriptionMat.opacity = MathUtils.lerp(descriptionMat.opacity, 0, alpha)

    link.position.lerp(link.domLayout.position, alpha)
    link.scale.lerp(link.domLayout.scale.multiplyScalar(0.1), alpha)
    linkMat.opacity = MathUtils.lerp(linkMat.opacity, 0, alpha)
  } else if (nextMode === 'interacting') {
    // ?????? ????????????????????????
    // const entity = Engine.instance.currentWorld.localClientEntity
    // changeAvatarAnimationState(entity, AvatarStates.DANCE1)
    if (xrui.state.productData.type.value === 'congba') {
      // ????????????????????? ?????????????????? ??????????????????????????????mp3
      const mediaArr = xrui.state.productData.congbaArr.value
      const curIndex = xrui.state.productData.curIndex.value
      let curObj
      if (mediaArr !== null) {
        curObj = mediaArr[curIndex % 3]
      }
      // ????????????
      xrui.state.productData.description.set(curObj.word)
      // ????????????
      if (soundEffect && !soundEffect.paused) {
        soundEffect.pause()
      }
      if(soundEffect.currentSrc != curObj.voice) {
        soundEffect.src = curObj.voice
        soundEffect.play() //?????? mp3??????????????????
      }
      // ??????????????????
      xrui.state.productData.curIndex.set(curIndex + 1)
      // ????????????????????????
      xrui.state.productData.congbaStatus.set(true)
      xrui.state.mode.set('inactive')
    } else {
      // ??????????????????????????? ????????????????????????
      interactHintMat.opacity = MathUtils.lerp(interactHintMat.opacity, 0, alpha)
      const uiSize = uiContainer.rootLayer.domSize

      const screenSize = EngineRenderer.instance.renderer.getSize(SCREEN_SIZE)
      const scaleMultiplier = (screenSize.width > 400) ? 0.9 : 0.85
      const uiContainerScale =
        ObjectFitFunctions.computeContentFitScaleForCamera(INTERACTING_UI_POSITION.z, uiSize.x, uiSize.y, 'contain') *
        scaleMultiplier
      uiContainer.position.lerp(INTERACTING_UI_POSITION, alpha)
      uiContainer.quaternion.slerp(INTERACTING_CAMERA_ROTATION, alpha)
      uiContainer.scale.lerp(_vect.setScalar(uiContainerScale), alpha)
      // ?????????card?????? ??????
      if (xrui.state.productData.type.value === 'card') {
        console.log('????????????????????????')
        const modal = getComponent(productEntity, ModelComponent)
        // todo1 ?????????????????? ?????????????????? NotificationService.dispatchNotify ???????????? ?????? return
        if(voteState != 0){
          console.log('???????????????,??????????????????...?????????????????????', voteState)
        }
        // ????????????????????????false ?????????????????? ??????????????????
        if (!xrui.state.productData.rotateStatus.value) {
          voteState = 1
          // ?????????3?????? ??????????????????
          xrui.state.productData.endTime.set(world.elapsedSeconds + LUCKY_ROTATE_DURATION)
          xrui.state.productData.rotateStatus.set(true)
          // todo ???????????????????????????????????? ?????????????????????????????????????????????????????????
          const mask = document.getElementsByClassName('luckDrawMask')[0]
          mask.style.display = 'block'
          NotificationService.dispatchNotify('?????????????????????????????????', {variant: 'info'})
          // todo2 ????????????????????????????????????id??????????????? resultId?????? ????????????????????????????????????
          const userID = localStorage.getItem('API_LOGIN_ID')
          Axios({
            url: 'https://biz-api.xr-bgy-prd.yee.link/prize/get',
            method: 'post',
            data: `user_id=${userID}`,
          }).then(res => {
            // ????????????
            voteState = 0
            if (res.data.code == 200) {
              console.log('++++++', res.data)
              NotificationService.dispatchNotify(`??????${res.data.data.prizeRestTime}??????????????????~`, {variant: 'info'})
              // ????????????????????? id ??? name????????????
              console.log('????????????---',res.data)
              var resultId = '228f0c4d-2099-4265-82ab-5689c7adcc0f'
              const resultName = `${res.data.data.prize}`
              resultImg = res.data.data.prizeIcon
              console.log('image',resultImg)
              // const resultId = '228f0c4d-2099-4265-82ab-5689c7adcc0f'
              // const resultName = '????????????????????????'
              // ??????????????????
              xrui.state.productData.resultId.set(resultId)
              xrui.state.productData.resultName.set(resultName)
              // xrui.state.productData.resultImg.set(imgs)
              console.log('??????', xrui.state.productData.resultName.value)
              const prizeObj = obj3dFromUuid(resultId) as Group
              console.log(prizeObj)
              // ?????????????????????????????????????????? ?????????????????????????????????????????????
              prizeObj.userData.showTime = xrui.state.productData.endTime.value
              prizeObj.userData.endTime = xrui.state.productData.endTime.value + PRIZE_SHOW_DURATION
              console.log(prizeObj.userData.showTime)
              xrui.state.mode.set('inactive')
              const mask = document.getElementsByClassName('luckDrawMask')[0]
              mask.style.display = 'none'
              const luckyTips = document.getElementsByClassName('success-container')[0]
              luckyTips.style.display = 'block'
              luckyTips.style.pointerEvents = 'auto'
              console.log('?????????????????????',resultName,resultImg)
              document.getElementsByClassName('suc-content')[0].innerHTML = '??????????????????' + resultName + '!'
              document.getElementsByClassName('suc-img')[0].src = resultImg
              if(res.data.data.isSurvey == 0){
                setTimeout(()=>{
                document.getElementById('questionnaire').style.display = 'flex'
                document.getElementById('questionnaire').style.pointerEvents = 'auto'
              },3000)
              }
              
            }
            if (res.data.code == 501) {
              NotificationService.dispatchNotify(res.data.message, {variant: 'info'})
              xrui.state.productData.endTime.set(0)
              xrui.state.productData.rotateStatus.set(false)
              // ????????????????????? inactive ??????????????????
              xrui.state.mode.set('inactive')
              const mask = document.getElementsByClassName('luckDrawMask')[0]
              mask.style.display = 'none'
            }else{
			  xrui.state.mode.set('inactive')
              NotificationService.dispatchNotify(res.data.message, {variant: 'info'})
              xrui.state.productData.endTime.set(0)
              xrui.state.productData.rotateStatus.set(false)
              const mask = document.getElementsByClassName('luckDrawMask')[0]
              mask.style.display = 'none' 
            }
          }).catch(err => {
            // ????????????
            voteState = 0
            NotificationService.dispatchNotify(err.message, {variant: 'error'})
            xrui.state.productData.endTime.set(0)
            xrui.state.productData.rotateStatus.set(false)
            // ????????????????????? inactive ??????????????????
            xrui.state.mode.set('inactive')
            const mask = document.getElementsByClassName('luckDrawMask')[0]
            mask.style.display = 'none'
          })
        }
        // ??????????????????????????????????????? ??????
        if (xrui.state.productData.endTime.value > world.elapsedSeconds) {
          modelTargetGroup.rotation.set(0, 5 * world.elapsedSeconds, 0)
        } else {
          // ?????????????????? ?????????????????????0
          xrui.state.productData.endTime.set(0)
          xrui.state.productData.rotateStatus.set(false)
          // ????????????????????? inactive ??????????????????
          xrui.state.mode.set('inactive')
          // const mask = document.getElementsByClassName('luckDrawMask')[0]
          // mask.style.display = 'none'
          // // ??????????????????
          // const resultName = xrui.state.productData.resultName.value
          // const resultId = xrui.state.productData.resultId.value
          // // ?????????????????? ??????????????????
          // // NotificationService.dispatchNotify(`???????????????${resultName}???`, {variant: 'success'})
          // const luckyTips = document.getElementsByClassName('success-container')[0]
          // luckyTips.style.display = 'block'
          // console.log('?????????????????????',resultName,resultImg)
          // document.getElementsByClassName('suc-content')[0].innerHTML = '??????????????????' + resultName + '!'
          // // document.getElementsByClassName('suc-img')[0].src = 'https://xr.yee.link/projects/bgy-project/assets/meidi.png'
          // document.getElementsByClassName('suc-img')[0].src = resultImg
        }
        titleMat.opacity = MathUtils.lerp(titleMat.opacity, 0, alpha)
         // ????????????
         voteState = 0

      } else if (xrui.state.productData.type.value === 'guide') {
        // ?????????guide?????? ????????????????????????true ??????????????????   
        // if (!xrui.state.productData.guideStatus.value) {
          NotificationService.dispatchNotify('??????????????????', {variant: 'info'})
          xrui.state.productData.guideStatus.set(true)
          xrui.state.mode.set('active')
          // ????????????????????????
          const defaultDom = document.getElementById('default')
          const guide = document.getElementsByClassName('guide-container')[0]
          defaultDom.style.pointerEvents = 'auto'
          guide.style.display = 'flex'
        // }
          // ??????guideID ?????????Id????????????????????????

      } else {
        // ?????? ??????????????????
        // const ctlBox = document.getElementById('ctrlBox')
        // const userMenuBox = document.getElementById('userMenuBox')
        // // const settingContainers = document.getElementById('settingContainer')
        // // settingContainers.style.display = 'none'
        // ctlBox.style.display = 'none'
        // userMenuBox.style.display = 'none'
        rootMat.opacity = MathUtils.lerp(rootMat.opacity, 1, alpha)
        const mpp = 1 / xrui.container.manager.pixelsPerMeter
        title.position.lerp(title.domLayout.position, alpha)
        title.scale.lerp(_vect.copy(title.domLayout.scale).multiplyScalar(0.99), alpha)
        titleMat.opacity = MathUtils.lerp(titleMat.opacity, 1, alpha)
        interactHint.position.lerp(interactHint.domLayout.position, alpha)
        interactHintMat.opacity = MathUtils.lerp(interactHintMat.opacity, 0, alpha)

        const descriptionAlpha = Math.min((transitionElapsed - 0.2) / (duration * 3), 1)
        description.position.lerp(description.domLayout.position, descriptionAlpha)
        descriptionMat.opacity = MathUtils.lerp(descriptionMat.opacity, 1, descriptionAlpha)


        const linkAlpha = Math.min((transitionElapsed - 0.3) / (duration * 3), 1)
        link.position.lerp(link.domLayout.position, linkAlpha)
        link.scale.lerp(link.domLayout.scale, linkAlpha)
        linkMat.opacity = MathUtils.lerp(linkMat.opacity, xrui.state.productData.type.value === 'paper' ? 0 : 1, linkAlpha)
      }
    }

    // ??????????????????
    if(xrui.state.productData.type.value === 'video' || xrui.state.productData.type.value === 'congba'){
      // ??????????????????
      if(xrui.state.productData.type.value === 'video'){
        playVideo()
      }
    }
  }

  // ??????guideID ?????????Id????????????????????????
  const guideId = localStorage.getItem('guideId')
  if (guideId) {
    try{
      localStorage.removeItem('guideId')
      console.log('?????????ID', guideId)
      const portalOutObj = obj3dFromUuid(guideId) as Group
      console.log('??????',portalOutObj)
      const portalOutComponent = getComponent(portalOutObj.entity, ProductComponent)
      console.log('??????2',portalOutComponent)
      // ????????????????????????
      const avatarTransform = getComponent(world.localClientEntity, TransformComponent)
      console.log(avatarTransform)
      avatarTransform.position.setX(portalOutObj.position.x)
      avatarTransform.position.setY(portalOutObj.position.y)
      avatarTransform.position.setZ(portalOutObj.position.z)
      avatarTransform.rotation.set(portalOutObj.rotation.x, portalOutObj.rotation.y, portalOutObj.rotation.z)
      setTimeout(() => {
        // ????????????????????????false
        xrui.state.productData.guideStatus.set(false)
      }, 200)
    }catch{
      localStorage.removeItem('guideId') 
      console.log('????????????')
    }
  }
 

  // ????????????????????????
  const resultId = xrui.state.productData.resultId.value
  if(resultId){
    const prizeObj = obj3dFromUuid(resultId) as Group
    const modelTargetPosition = _vect.copy(anchorPosition)
    // ??????????????????????????????????????????????????????????????? ????????????
    if (world.elapsedSeconds > prizeObj.userData.showTime && world.elapsedSeconds < prizeObj.userData.endTime) {
      console.log('????????????')
      // ????????????????????????????????????
      // setVisibleComponent(prizeObj.entity, true)
      // ??????????????????&???????????? ????????????????????????
      prizeObj.rotation.set(0, world.elapsedSeconds, 0)
      prizeObj.position.setX(modelTargetPosition.x)
      prizeObj.position.setZ(modelTargetPosition.z)
      prizeObj.position.setY(2)
      console.log('???')
    } else if (world.elapsedSeconds > prizeObj.userData.endTime) {
      console.log('????????????')
      prizeObj.position.setY(-20)
      // setVisibleComponent(prizeObj.entity, false)
      // ??????????????????
      delete prizeObj.userData.showTime
      delete prizeObj.userData.endTime
      // ??????????????????
      xrui.state.productData.resultId.set(null)
      xrui.state.productData.resultName.set(null)
    }
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
