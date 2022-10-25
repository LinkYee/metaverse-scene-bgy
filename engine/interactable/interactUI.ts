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

const LUCKY_ROTATE_DURATION = 3 // 轮盘旋转持续时间
const PRIZE_SHOW_DURATION = 10 // 奖品展示持续时间
const PORTAL_IN_ID = 'dd1eafe4-dc87-4353-b3ae-567d4f81c032' // 传送门入口id
const PORTAL_OUT_ID = '2d7f9f97-20a0-40e8-a504-682f650af501' // 传送门出口id
let LAST_VIDEO_STATUS_FLIP_TIME = 0;
const _vect = new Vector3()
const _quat = new Quaternion()
let congbaPlayer = null
let guideTimer;
let guideTimerCounter = 0;
let _uiCount = 0
var resultImg = ''

const soundEffect = new Audio();
soundEffect.autoplay = true;
setTimeout(function(){
  soundEffect.src = "data:audio/mpeg;base64,SUQzBAAAAAABEVRYWFgAAAAtAAADY29tbWVudABCaWdTb3VuZEJhbmsuY29tIC8gTGFTb25vdGhlcXVlLm9yZwBURU5DAAAAHQAAA1N3aXRjaCBQbHVzIMKpIE5DSCBTb2Z0d2FyZQBUSVQyAAAABgAAAzIyMzUAVFNTRQAAAA8AAANMYXZmNTcuODMuMTAwAAAAAAAAAAAAAAD/80DEAAAAA0gAAAAATEFNRTMuMTAwVVVVVVVVVVVVVUxBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/zQsRbAAADSAAAAABVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/zQMSkAAADSAAAAABVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV";
}, 15000)

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
  var allNodes = document.querySelectorAll('[id^=container-xrui-]');
  allNodes.forEach(singleNode => { 
    if(singleNode && singleNode.shadowRoot){
      let video = singleNode.shadowRoot.getElementById('productVideo');
      video && video.pause(); 
    }
  })
}

function pauseBGM() {
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
    // 隐藏控制按钮
    // const ctlBox = document.getElementById('ctrlBox')
    // const userMenuBox = document.getElementById('userMenuBox')
    // if(ctlBox){
    //   ctlBox.style.display = 'block'
    // }
   
    // userMenuBox.style.display = 'block'
    if (xrui.state.productData.type.value === 'video') {
      // 如果是视频 暂停
      pauseVideo()
    }
    // 聪吧非聚焦状态闭嘴
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
    interactHint.position.y -= 0.1
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
      // 如果是视频 暂停
      pauseVideo() 
    }
    // 卡片类型不要全系框
    // if (xrui.state.productData.type.value === 'card') return;
    if (modelTargetGroup.parent !== world.scene) {
      world.scene.attach(modelTargetGroup)
    }
    // 聪吧非聚焦状态闭嘴
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
    interactHint.position.y -= 0.15
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
    // 动作 先随便用一个代替
    // const entity = Engine.instance.currentWorld.localClientEntity
    // changeAvatarAnimationState(entity, AvatarStates.DANCE1)
    if (xrui.state.productData.type.value === 'congba') {
      // 如果是聪吧类型 全系框不消失 按顺序插入文本且播放mp3
      const mediaArr = xrui.state.productData.congbaArr.value
      const curIndex = xrui.state.productData.curIndex.value
      let curObj
      if (mediaArr !== null) {
        curObj = mediaArr[curIndex % 3]
      }
      // 切换文案
      xrui.state.productData.description.set(curObj.word)
      // 播放语音
      if (soundEffect) {
        soundEffect.pause()
      }
      pauseBGM();
      soundEffect.src = curObj.voice
      soundEffect.play() //播放 mp3这个音频对象
      // 修改当前下标
      xrui.state.productData.curIndex.set(curIndex + 1)
      // 设置聪吧交互状态
      xrui.state.productData.congbaStatus.set(true)
      xrui.state.mode.set('inactive')
    } else {
      // 其他类型全系框消失 然后做对应的相应
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
      // 如果是card类型 旋转
      if (xrui.state.productData.type.value === 'card') {
        console.log('我开始卡片抽奖了')
        const modal = getComponent(productEntity, ModelComponent)
        // todo1 判断抽奖次数 如果没有次数 NotificationService.dispatchNotify 一个提示 然后 return
        // 如果当前旋转状态false 设置结束时间 并且开始旋转
        if (!xrui.state.productData.rotateStatus.value) {
          // 设置为3秒后 旋转三秒停止
          xrui.state.productData.endTime.set(world.elapsedSeconds + LUCKY_ROTATE_DURATION)
          xrui.state.productData.rotateStatus.set(true)
          // todo 这里弄一个最顶层的遮罩层 防止用户点击屏幕中断抽奖旋转和重复抽奖
          const mask = document.getElementsByClassName('luckDrawMask')[0]
          mask.style.display = 'block'
          NotificationService.dispatchNotify('正在抽奖中，请勿离开～', {variant: 'info'})
          // todo2 这里调用接口将返回的奖品id放到轮盘的 resultId字段 奖品会自动出现在轮盘上方
          const userID = localStorage.getItem('API_LOGIN_ID')
          Axios({
            url: 'https://xr.yee.link/bgy-api/prize/get',
            method: 'post',
            data: `user_id=${userID}`,
          }).then(res => {
            if (res.data.code == 200) {
              console.log('++++++', res.data)
              NotificationService.dispatchNotify(`还有${res.data.data.s}次抽奖机会哦~`, {variant: 'info'})
              // 假设这里拿到的 id 和 name分别为：
              console.log('抽奖结果---',res.data)
              var resultId = '228f0c4d-2099-4265-82ab-5689c7adcc0f'
              const resultName = `${res.data.data.prize}`
              resultImg = res.data.data.prizeIcon
              // const resultId = '228f0c4d-2099-4265-82ab-5689c7adcc0f'
              // const resultName = '熬夜写代码特等奖'
              // 记录抽奖结果
              xrui.state.productData.resultId.set(resultId)
              xrui.state.productData.resultName.set(resultName)
              // xrui.state.productData.resultImg.set(imgs)
              console.log('查看', xrui.state.productData.resultName.value)
              const prizeObj = obj3dFromUuid(resultId) as Group
              console.log(prizeObj)
              // 设置奖品出现的时间和消失时间 出现时间设置为轮盘旋转结束时间
              prizeObj.userData.showTime = xrui.state.productData.endTime.value
              prizeObj.userData.endTime = xrui.state.productData.endTime.value + PRIZE_SHOW_DURATION
              console.log(prizeObj.userData.showTime)
            }
            if (res.data.code == 501) {
              NotificationService.dispatchNotify(res.data.message, {variant: 'info'})
              xrui.state.productData.endTime.set(0)
              xrui.state.productData.rotateStatus.set(false)
              // 模型状态设置为 inactive 防止再次旋转
              xrui.state.mode.set('inactive')
              const mask = document.getElementsByClassName('luckDrawMask')[0]
              mask.style.display = 'none'
            }else{
              NotificationService.dispatchNotify(res.data.message, {variant: 'info'})
              xrui.state.productData.endTime.set(0)
              xrui.state.productData.rotateStatus.set(false)
              const mask = document.getElementsByClassName('luckDrawMask')[0]
              mask.style.display = 'none' 
            }
          }).catch(err => {
            NotificationService.dispatchNotify(res.data.message, {variant: 'info'})
            xrui.state.productData.endTime.set(0)
            xrui.state.productData.rotateStatus.set(false)
            // 模型状态设置为 inactive 防止再次旋转
            xrui.state.mode.set('inactive')
            const mask = document.getElementsByClassName('luckDrawMask')[0]
            mask.style.display = 'none'
          })
        }
        // 世界时间小于设置的停止时间 旋转
        if (xrui.state.productData.endTime.value > world.elapsedSeconds) {
          modelTargetGroup.rotation.set(0, 5 * world.elapsedSeconds, 0)
        } else {
          // 轮盘旋转结束 结束时间设置为0
          xrui.state.productData.endTime.set(0)
          xrui.state.productData.rotateStatus.set(false)
          // 模型状态设置为 inactive 防止再次旋转
          xrui.state.mode.set('inactive')
          const mask = document.getElementsByClassName('luckDrawMask')[0]
          mask.style.display = 'none'
          // 拿到抽奖结果
          const resultName = xrui.state.productData.resultName.value
          const resultId = xrui.state.productData.resultId.value
          // 提示抽奖成功 展示奖品名字
          // NotificationService.dispatchNotify(`恭喜你获得${resultName}！`, {variant: 'success'})
          const luckyTips = document.getElementsByClassName('success-container')[0]
          luckyTips.style.display = 'block'
          setTimeout(() => {  //5s之后掩藏弹窗
            luckyTips.style.display = 'none'
          }, 5000)
          console.log('传递的抽奖信息',resultName,resultImg)
          document.getElementsByClassName('suc-content')[0].innerHTML = '恭喜你获得了' + resultName + '!'
          // document.getElementsByClassName('suc-img')[0].src = 'https://xr.yee.link/projects/bgy-project/assets/meidi.png'
          document.getElementsByClassName('suc-img')[0].src = resultImg
        }
        titleMat.opacity = MathUtils.lerp(titleMat.opacity, 0, alpha)


      } else if (xrui.state.productData.type.value === 'guide') {
        // 如果是guide类型 并且当权状态不为true 打开传送面板   
        // if (!xrui.state.productData.guideStatus.value) {
          NotificationService.dispatchNotify('打开传送面板', {variant: 'info'})
          xrui.state.productData.guideStatus.set(true)
          xrui.state.mode.set('active')
          // 打开一个选择面板
          const defaultDom = document.getElementById('default')
          const guide = document.getElementsByClassName('guide-container')[0]
          defaultDom.style.pointerEvents = 'auto'
          guide.style.display = 'flex'
        // }
          // 获取guideID 如果有Id说明用户已经选择
          guideTimer = setInterval(function(){
            let guideId = localStorage.getItem('guideId')
            if (guideId) {
              let portalOutObj = obj3dFromUuid(guideId) as Group
              console.log('传送',portalOutObj)
              let portalOutComponent = getComponent(portalOutObj.entity, ProductComponent)
              console.log('传送2',portalOutComponent)

              // 修改用户当前坐标
              const avatarTransform = getComponent(world.localClientEntity, TransformComponent)
              console.log(avatarTransform)
              avatarTransform.position.setX(portalOutComponent.portalPosition.x)
              avatarTransform.position.setY(portalOutComponent.portalPosition.y)
              avatarTransform.position.setZ(portalOutComponent.portalPosition.z)
              avatarTransform.rotation.set(portalOutComponent.portalRotation.x, portalOutComponent.portalRotation.y, portalOutComponent.portalRotation.z)
              localStorage.removeItem('guideId')
              setTimeout(() => {
                // 将面板状态设置为false
                xrui.state.productData.guideStatus.set(false)
                clearInterval(guideTimer)
              }, 200)
            }
        }, 500)

      } else {
        // 投票 隐藏控制按钮
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

    // 静音部分处理
    if(xrui.state.productData.type.value === 'video' || xrui.state.productData.type.value === 'congba'){
      // 手动播放视频
      if(xrui.state.productData.type.value === 'video'){
        playVideo()
      }
      //背景音乐静音
      pauseBGM() 
    }
  }

  

  // 根据拿到奖品模型
  const resultId = xrui.state.productData.resultId.value
  if(resultId){
    const prizeObj = obj3dFromUuid(resultId) as Group
    const modelTargetPosition = _vect.copy(anchorPosition)
    // 如果世界时间大于奖品开始时间且小于结束时间 出现奖品
    if (world.elapsedSeconds > prizeObj.userData.showTime && world.elapsedSeconds < prizeObj.userData.endTime) {
      console.log('出现奖品')
      // 设置奖品位置为轮盘正上方
      // setVisibleComponent(prizeObj.entity, true)
      // 设置奖品旋转&上下浮动 位置为轮盘正上方
      prizeObj.rotation.set(0, world.elapsedSeconds, 0)
      prizeObj.position.setX(modelTargetPosition.x)
      prizeObj.position.setZ(modelTargetPosition.z)
      prizeObj.position.setY(2)
      console.log('???')
    } else if (world.elapsedSeconds > prizeObj.userData.endTime) {
      console.log('隐藏奖品')
      prizeObj.position.setY(-20)
      // setVisibleComponent(prizeObj.entity, false)
      // 清除奖品属性
      delete prizeObj.userData.showTime
      delete prizeObj.userData.endTime
      // 清除抽奖结果
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
