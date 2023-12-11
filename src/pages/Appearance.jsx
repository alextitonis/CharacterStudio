import React, { useContext, useEffect } from "react"
import styles from "./Appearance.module.css"
import { ViewMode, ViewContext } from "../context/ViewContext"
import { SceneContext } from "../context/SceneContext"
import Editor from "../components/Editor"
import CustomButton from "../components/custom-button"
import { LanguageContext } from "../context/LanguageContext"
import { SoundContext } from "../context/SoundContext"
import { AudioContext } from "../context/AudioContext"
import FileDropComponent from "../components/FileDropComponent"
import { getFileNameWithoutExtension } from "../library/utils"
import { getTraitOption } from "../library/option-utils"
import { getDataArrayFromNFTMetadata } from "../library/file-utils"
import MenuTitle from "../components/MenuTitle"
import Selector from "../components/Selector"
import TraitInformation from "../components/TraitInformation"
import { TokenBox } from "../components/token-box/TokenBox"
import JsonAttributes from "../components/JsonAttributes"
import cancel from "../images/cancel.png"

function Appearance({
  animationManager,
  blinkManager,
  lookatManager,
  effectManager,
  confirmDialog,
  // characterManager
}) {
  const { isLoading, setViewMode } = React.useContext(ViewContext)
  const {
    resetAvatar,
    toggleDebugMNode,
    templateInfo,
    setSelectedOptions,
    currentVRM,
    setDisplayTraitOption,
    characterManager,
    moveCamera
  } = React.useContext(SceneContext)
  

  const { playSound } = React.useContext(SoundContext)
  const { isMute } = React.useContext(AudioContext)
  const { t } = useContext(LanguageContext)

  const back = () => {
    !isMute && playSound('backNextButton');
    resetAvatar()
    setViewMode(ViewMode.CREATE)
    setDisplayTraitOption(null);
  }

  const [jsonSelectionArray, setJsonSelectionArray] = React.useState(null)
  const [uploadTextureURL, setUploadTextureURL] = React.useState(null)
  const [traits, setTraits] = React.useState(null)
  const [traitGroupName, setTraitGroupName] = React.useState("")
  const [selectedTraitID, setSelectedTraitID] = React.useState(null)

  // XXX Remove
  useEffect(()=>{
    if (uploadTextureURL != null && currentVRM != null){
      setTextureToChildMeshes(currentVRM.scene,uploadTextureURL)
    }
  },[uploadTextureURL])

  const next = () => {
    !isMute && playSound('backNextButton');
    setViewMode(ViewMode.BIO);
    setDisplayTraitOption(null);
  }

  const randomize = () => {
    characterManager.loadRandomTraits();
  }


  const debugMode = () =>{
    toggleDebugMNode()
  }

  const handleAnimationDrop = async (file) => {
    const animName = getFileNameWithoutExtension(file.name);
    const path = URL.createObjectURL(file);
    await animationManager.loadAnimation(path, true, "", animName);
  }

  const handleImageDrop = (file) => {
    const path = URL.createObjectURL(file);
    setUploadTextureURL(path);
  }
  const handleVRMDrop = (file) =>{
    const path = URL.createObjectURL(file);
    if (traitGroupName != ""){
      characterManager.loadCustomTrait(traitGroupName, path);
    }
    else{
      console.warn("Please select a group trait first.")
    }
  }

  const handleFilesDrop = async(files) => {
    const file = files[0];
    // Check if the file has the .fbx extension
    if (file && file.name.toLowerCase().endsWith('.fbx')) {
      handleAnimationDrop(file);
    } 
    if (file && (file.name.toLowerCase().endsWith('.png') || file.name.toLowerCase().endsWith('.jpg'))) {
      handleImageDrop(file);
    } 
    if (file && file.name.toLowerCase().endsWith('.vrm')) {
      handleVRMDrop(file);
    } 
    if (file && file.name.toLowerCase().endsWith('.json')) {
      getDataArrayFromNFTMetadata(files, templateInfo).then((jsonDataArray)=>{
        if (jsonDataArray.length > 0){
          // This code will run after all files are processed
          setJsonSelectionArray(jsonDataArray);
          setSelectedOptions(jsonDataArray[0].options);
        }
      })
    } 
  };

  const selectTraitGroup = (traitGroup) => {
    !isMute && playSound('optionClick');
    console.log(traitGroup);
    console.log(traitGroupName);
    if (traitGroupName !== traitGroup.trait){
      setTraits(characterManager.getTraits(traitGroup.trait));
      setTraitGroupName(traitGroup.trait);
      setSelectedTraitID(characterManager.getCurrentTraitID(traitGroup.trait));
      moveCamera({ targetY: traitGroup.cameraTarget.height, distance: traitGroup.cameraTarget.distance})
    }
    else{
      setTraits(null);
      setTraitGroupName("");
      setSelectedTraitID(null);
      moveCamera({ targetY: 0.8, distance: 3.2 })
    }
  }


  const uploadTrait = async() =>{
    var input = document.createElement('input');
    input.type = 'file';
    input.accept=".vrm"

    input.onchange = e => { 
      var file = e.target.files[0]; 
      if (file.name.endsWith(".vrm")){
        const url = URL.createObjectURL(file);
        characterManager.loadCustomTrait(traitGroupName,url)
        setSelectedTraitID(null);
      }
    }
    input.click();
  }

  return (
    <div className={styles.container}>
      <div className={`loadingIndicator ${isLoading ? "active" : ""}`}>
        <img className={"rotate"} src="ui/loading.svg" />
      </div>
      <div className={"sectionTitle"}>{t("pageTitles.chooseAppearance")}</div>
      <FileDropComponent 
         onFilesDrop={handleFilesDrop}
      />
      {/* Main Menu section */}
      <div className={styles["sideMenu"]}>
        <MenuTitle title="Appearance" left={20}/>
        <div className={styles["bottomLine"]} />
        <div className={styles["scrollContainer"]}>
          <div className={styles["editor-container"]}>
            {
              characterManager.getGroupTraits().map((traitGroup, index) => (
                <div key={"options_" + index} className={styles["editorButton"]}>
                  <TokenBox
                    size={56}
                    icon={ traitGroup.fullIconSvg }
                    rarity={traitGroupName !== traitGroup.name ? "none" : "mythic"}
                    onClick={() => {
                      selectTraitGroup(traitGroup)
                    }}
                  />
                </div>
              ))
            }
          </div>
        </div>
      </div>

      {/* Option Selection section */
      !!traits && (
        <div className={styles["selectorContainerPos"]}>
        
          <MenuTitle title={traitGroupName} width={130} left={20}/>
          <div className={styles["bottomLine"]} />
          <div className={styles["scrollContainer"]}>
            <div className={styles["selector-container"]}>
              {/* Null button section */
                !characterManager.isTraitGroupRequired(traitGroupName) ? (
                  <div
                    key={"no-trait"}
                    className={`${styles["selectorButton"]}`}
                    icon={cancel}
                    onClick={() => {
                      characterManager.removeTrait(traitGroupName);
                      setSelectedTraitID(null);
                    }}
                  >
                    <TokenBox
                      size={56}
                      icon={cancel}
                      rarity={selectedTraitID == null ? "mythic" : "none"}
                    />
                  </div>
                ) : (
                  <></>
                )
              }
              {/* All buttons section */
              traits.map((trait) => {
                let active = trait.id === selectedTraitID
                return (
                  <div
                    key={trait.id}
                    className={`${styles["selectorButton"]}`}
                    onClick={() => {
                      characterManager.loadTrait(trait.traitGroup.trait, trait.id)
                      setSelectedTraitID(trait.id);
                    }}
                  >
                    <TokenBox
                      size={56}
                      icon={trait.fullThumbnail}
                      rarity={active ? "mythic" : "none"}      
                    />
                  </div>
                )
              })}
            </div>
          </div>
          
          <div className={styles["uploadContainer"]}>
            <div 
              className={styles["uploadButton"]}
              onClick={uploadTrait}>
              <div> 
                Upload </div>
            </div>
            
          </div>
        </div>
      )}
      <JsonAttributes jsonSelectionArray={jsonSelectionArray}/>
      <TraitInformation currentVRM={currentVRM} animationManager={animationManager} lookatManager={lookatManager}
      />
      <div className={styles.buttonContainer}>
        <CustomButton
          theme="light"
          text={t('callToAction.back')}
          size={14}
          className={styles.buttonLeft}
          onClick={back}
        />
        <CustomButton
          theme="light"
          text={t('callToAction.next')}
          size={14}
          className={styles.buttonRight}
          onClick={next}
        />
        <CustomButton
          theme="light"
          text={t('callToAction.randomize')}
          size={14}
          className={styles.buttonCenter}
          onClick={randomize}
        />
        <CustomButton
          theme="light"
          text={"debug"}
          size={14}
          className={styles.buttonCenter}
          onClick={debugMode}
        />
      </div>
    </div>
  )
}

export default Appearance
