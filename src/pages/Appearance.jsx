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

function Appearance({
  animationManager,
  blinkManager,
  lookatManager,
  effectManager,
  confirmDialog
}) {
  const { isLoading, setViewMode } = React.useContext(ViewContext)
  const {
    resetAvatar,
    getRandomCharacter,
    isChangingWholeAvatar,
    setIsChangingWholeAvatar,
    toggleDebugMNode,
    templateInfo,
    setSelectedOptions,
    setCurrentVRM,
    setDisplayTraitOption,
  } = React.useContext(SceneContext)
  

  const { playSound } = React.useContext(SoundContext)
  const { isMute } = React.useContext(AudioContext)
  const back = () => {
    !isMute && playSound('backNextButton');
    resetAvatar()
    setViewMode(ViewMode.CREATE)
    setDisplayTraitOption(null);
  }

  const [jsonSelectionArray, setJsonSelectionArray] = React.useState(null)
  const [uploadTextureURL, setUploadTextureURL] = React.useState(null)
  const [uploadVRMURL, setUploadVRMURL] = React.useState(null)

  const next = () => {
    !isMute && playSound('backNextButton');
    setViewMode(ViewMode.BIO);
    setDisplayTraitOption(null);
  }

  const randomize = () => {
    if (!isChangingWholeAvatar) {
      !isMute && playSound('randomizeButton');
      getRandomCharacter()
    }
  }

  const debugMode = () =>{
    toggleDebugMNode()
  }

  useEffect(() => {
    const setIsChangingWholeAvatarFalse = () => setIsChangingWholeAvatar(false)

    effectManager.addEventListener(
      "fadeintraitend",
      setIsChangingWholeAvatarFalse,
    )
    effectManager.addEventListener(
      "fadeinavatarend",
      setIsChangingWholeAvatarFalse,
    )
    return () => {
      effectManager.removeEventListener(
        "fadeintraitend",
        setIsChangingWholeAvatarFalse,
      )
      effectManager.removeEventListener(
        "fadeinavatarend",
        setIsChangingWholeAvatarFalse,
      )
    }
  }, [])

  // Translate hook
  const { t } = useContext(LanguageContext)

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
    setUploadVRMURL(path);
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

  return (
    <div className={styles.container}>
      <div className={`loadingIndicator ${isLoading ? "active" : ""}`}>
        <img className={"rotate"} src="ui/loading.svg" />
      </div>
      <div className={"sectionTitle"}>{t("pageTitles.chooseAppearance")}</div>
      <FileDropComponent 
         onFilesDrop={handleFilesDrop}
      />
      <Editor
        animationManager={animationManager}
        blinkManager={blinkManager}
        lookatManager={lookatManager}
        effectManager={effectManager}
        confirmDialog={confirmDialog}
        jsonSelectionArray={jsonSelectionArray}
        uploadTextureURL = {uploadTextureURL}
        uploadVRMURL = {uploadVRMURL}
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
