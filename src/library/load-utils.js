import { VRMLoaderPlugin, VRMUtils } from '@pixiv/three-vrm';
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader"
import { getAsArray, renameVRMBones } from "../library/utils"
import { findChildByName } from '../library/utils';
import { PropertyBinding } from 'three';

export const loadVRM = async(url) => {
    const gltfLoader = new GLTFLoader()
    gltfLoader.crossOrigin = 'anonymous';
    gltfLoader.register((parser) => {
      return new VRMLoaderPlugin(parser, {autoUpdateHumanBones: true})
    })
    
    const vrm = await gltfLoader.loadAsync(url);
    if (vrm.userData?.vrmMeta?.metaVersion === '0'){
      vrm.scene.rotation.y = Math.PI;
      vrm.scene.traverse((child)=>{
        if (child.isMesh) {
          child.userData.isVRM0 = true;
          if (child.isSkinnedMesh){
            for (let i =0; i < child.skeleton.bones.length;i++){
              child.skeleton.bones[i].userData.vrm0RestPosition = { ... child.skeleton.bones[i].position }
            }
          }
        }
      })
    }
    URL.revokeObjectURL(url);
    return vrm;
}

export const addVRMToScene = (vrm, scene) => {
  const vrmData = vrm.userData.vrm;
  renameVRMBones(vrmData);

  if (vrm && scene){
    scene.attach(vrm.scene)
  }
}

export const saveVRMCollidersToUserData = (gltf) => {
  if (gltf.parser.json.extensions?.VRM){
    saveVRM0Colliders(gltf);
  }
  else if (gltf.parser.json.extensions?.VRMC_vrm){
    saveVRM1Colliders(gltf)
  }
  else{
    console.warn("No valid vrm file was provided")
  }

}

const saveVRM0Colliders = (gltf) => {
  const json = gltf.parser.json
  const scene = gltf.scene;
  const nodes = json.nodes;
  const colliderGroups = json.extensions?.VRM?.secondaryAnimation?.colliderGroups;

  const namesUsed = [];
  const objectSceneNames = nodes.map((node) => uniqueNames(node.name, namesUsed));

  if (colliderGroups != null){
    colliderGroups.forEach(colliderGroup => {
      const nodeName = objectSceneNames[colliderGroup.node]
      const nodeObject = findChildByName(scene, nodeName);
      if (nodeObject != null){
        const colliders = colliderGroup.colliders;
        
        // match to be like vrm 1
        nodeObject.userData.VRMcolliders = colliders.map((collider) => (
          {sphere:{
            radius:collider.radius,
            offset:[collider.offset.x,collider.offset.y, collider.offset.z]
          }}));
      }
    });
  }
}

const saveVRM1Colliders = (gltf) => {
  const json = gltf.parser.json
  const scene = gltf.scene
  const nodes = json.nodes;
  const colliderGroups = json.extensions?.VRMC_springBone?.colliderGroups;
  const colliders = json.extensions?.VRMC_springBone?.colliders;
  // save to vrm data

  const namesUsed = [];
  const objectSceneNames = nodes.map((node) => uniqueNames(node.name, namesUsed));

  if (colliderGroups != null){

    colliderGroups.forEach(colliderGroup => {
      const collidersIndices = getAsArray(colliderGroup.colliders);
      let currentNodeIndex = -1;
      let currentNode = null;
      collidersIndices.forEach(index => {
        if (currentNodeIndex != colliders[index].node){
          currentNodeIndex = colliders[index].node;
          const nodeName = objectSceneNames[currentNodeIndex]
          currentNode = findChildByName(scene, nodeName);
          currentNode.userData.VRMcolliders = [];
        }
        if (currentNode != null){
          const colliderShape = colliders[index].shape;
          for (const shapeType in colliderShape){
            const shape = colliderShape[shapeType];
            if (shape?.offset){
              shape.offset[0] = -shape.offset[0];
            }
          }
          currentNode.userData.VRMcolliders.push(colliderShape)
        }
        else {
          console.error("no node with name " + objectSceneNames[currentNodeIndex] + " was found")
        }
        
      });
    });
  }
}

// code from gltf loader, follows the same process of renaming
const uniqueNames = (originalName, namesUsed) => {
  const sanitizedName = PropertyBinding.sanitizeNodeName(originalName || '');
  if (sanitizedName in namesUsed) {
      return sanitizedName + '_' + (++namesUsed[sanitizedName]);
  } else {
    namesUsed[sanitizedName] = 0;
      return sanitizedName;
  }
}