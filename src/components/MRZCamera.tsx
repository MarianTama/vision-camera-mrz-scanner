import React, {
  FC,
  PropsWithChildren,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Button,
  LayoutChangeEvent,
  PixelRatio,
  StyleProp,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
  ViewStyle,
} from 'react-native';
import {runOnJS} from 'react-native-reanimated';
import {
  Camera,
  Frame,
  useCameraDevices,
  useFrameProcessor,
  CameraPermissionStatus,
  CameraDevice,
} from 'react-native-vision-camera';
import {
  boundingBoxAdjustToView,
  BoundingFrame,
  Dimensions,
  MRZCameraProps,
  MRZFrame,
  TextBlock,
} from '../types/types';
import {scanMRZ} from '../util/wrapper';
import {sortFormatsByResolution} from '../util/sortFormatsByResolution';

const MRZCamera: FC<PropsWithChildren<MRZCameraProps>> = ({
  enableBoundingBox,
  boundingBoxStyle,
  boundingBoxHorizontalPadding,
  boundingBoxVerticalPadding,
  style,
  skipButtonEnabled: photoSkipButtonEnabled,
  skipButton: photoSkipButton,
  onSkipPressed: photoSkipOnPress,
  skipButtonStyle: photoSkipButtonStyle,
  cameraProps,
  onData,
  scanSuccess,
  skipButtonText,
  cameraDirection,
  isActiveCamera,
}) => {
  // Permissions
  const [hasPermission, setHasPermission] =
    useState<CameraPermissionStatus>('not-determined');

  // camera states
  const devices = useCameraDevices();
  const direction: 'front' | 'back' = cameraDirection ?? 'back';
  const device = devices[direction as keyof typeof devices] as
    | CameraDevice
    | undefined;
  const camera = useRef<Camera>(null);
  const {height: screenHeight, width: screenWidth} = useWindowDimensions();
  const [isActive, setIsActive] = useState(true);
  const [feedbackText, setFeedbackText] = useState<string>('');
  const [ocrElements, setOcrElements] = useState<BoundingFrame[]>([]);
  const [frameDimensions, setFrameDimensions] = useState<Dimensions>();
  const landscapeMode = screenWidth > screenHeight;
  const [pixelRatio, setPixelRatio] = useState<number>(1);

  // Cleanup function to release camera resources
  const cleanupCamera = useCallback(async () => {
    try {
      if (camera.current) {
        // Stop any ongoing camera operations
        setIsActive(false);
        // Clear any pending frame processing
        setOcrElements([]);
        setFeedbackText('');
        // Reset camera state
        setIsActive(false);
      }
    } catch (error) {
      console.warn('Error cleaning up camera:', error);
    }
  }, []);

  // Handle component unmount
  useEffect(() => {
    return () => {
      cleanupCamera();
    };
  }, [cleanupCamera]);

  // Handle isActiveCamera prop changes
  useEffect(() => {
    if (isActiveCamera === false) {
      cleanupCamera();
    }
  }, [isActiveCamera, cleanupCamera]);

  // Handle scanSuccess changes
  useEffect(() => {
    if (scanSuccess) {
      cleanupCamera();
    }
  }, [scanSuccess, cleanupCamera]);

  // which format should we use
  const formats = useMemo(
    () => device?.formats.sort(sortFormatsByResolution),
    [device?.formats],
  );

  const [format, setFormat] = useState(
    formats && formats.length > 0 ? formats[0] : undefined,
  );

  /**
   * Prevents sending copious amounts of scans
   */
  const handleScan = useCallback(
    (data: MRZFrame, frame: Frame) => {
      const isRotated = !landscapeMode;
      setFrameDimensions(
        isRotated
          ? {
              width: frame.height,
              height: frame.width,
            }
          : {
              width: frame.width,
              height: frame.height,
            },
      );
      if (
        data &&
        data.result &&
        data.result.blocks &&
        data.result.blocks.length === 0
      ) {
        setFeedbackText('');
      }

      if (
        data &&
        data.result &&
        data.result.blocks &&
        data.result.blocks.length > 0
      ) {
        let updatedOCRElements: BoundingFrame[] = [];
        data.result.blocks.forEach((block: TextBlock) => {
          if (block.frame.width / screenWidth < 0.8) {
            setFeedbackText('Hold Still');
          } else {
            setFeedbackText('Scanning...');
          }
          updatedOCRElements.push({...block.frame});
        });

        let lines: string[] = [];
        data.result.blocks.forEach((block: TextBlock) => {
          lines.push(block.text);
        });
        if (lines.length > 0 && isActive && onData) {
          setOcrElements(updatedOCRElements);
          onData(lines);
        } else {
          setOcrElements([]);
        }
      }
    },
    [isActive, landscapeMode, onData, screenWidth],
  );

  /* Setting the format to the first format in the formats array. */
  useEffect(() => {
    setFormat(formats && formats.length > 0 ? formats[0] : undefined);
  }, [device, formats]);

  /* Using the useFrameProcessor hook to process the video frames. */
  const frameProcessor = useFrameProcessor(
    frame => {
      'worklet';
      if (!scanSuccess) {
        const ocrData = scanMRZ(frame);
        runOnJS(handleScan)(ocrData, frame);
      }
    },
    [handleScan],
  );

  useEffect(() => {
    (async () => {
      const status = await Camera.requestCameraPermission();
      setHasPermission(status);
    })();
  }, []);

  /* Using the useMemo hook to create a style object. */
  const boundingStyle = useMemo<StyleProp<ViewStyle>>(
    () => ({
      position: 'absolute',
      top: 0,
      left: 0,
      width: screenWidth,
      height: screenHeight,
    }),
    [screenWidth, screenHeight],
  );

  const bounds = ocrElements[ocrElements.length - 1];

  //*****************************************************************************************
  // stylesheet
  //*****************************************************************************************

  const styles = StyleSheet.create({
    fixToText: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    skipButtonContainer: {
      position: 'absolute',
      bottom: screenHeight * 0.05,
      width: screenWidth,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
    },
    feedbackContainer: {
      position: 'absolute',
      top: screenHeight * 0.3,
      width: screenWidth,
      alignItems: 'center',
    },
    feedbackText: {
      backgroundColor: 'white',
      color: 'black',
      fontSize: 18,
      paddingRight: 8,
      paddingLeft: 8,
      textAlign: 'center',
    },
    boundingBox: {
      borderRadius: 5,
      borderWidth: 3,
      borderColor: 'yellow',
      position: 'absolute',
      left: bounds ? bounds.x * pixelRatio : 0,
      top: bounds ? bounds.y * pixelRatio : 0,
      height: bounds ? bounds.height : 35,
      width: bounds ? bounds.width : 35,
    },
  });

  return (
    <View style={style}>
      {device && hasPermission === 'granted' ? (
        <Camera
          style={cameraProps?.style ?? StyleSheet.absoluteFill}
          device={cameraProps?.device ?? device}
          torch={cameraProps?.torch}
          isActive={
            isActiveCamera
              ? isActiveCamera
              : cameraProps?.isActive
              ? cameraProps?.isActive
              : isActive
          }
          ref={camera}
          photo={cameraProps?.photo}
          video={cameraProps?.video}
          audio={cameraProps?.audio}
          zoom={cameraProps?.zoom}
          enableZoomGesture={cameraProps?.enableZoomGesture}
          format={cameraProps?.format ?? format}
          fps={cameraProps?.fps ?? 10}
          onError={cameraProps?.onError}
          onInitialized={cameraProps?.onInitialized}
          frameProcessor={cameraProps?.frameProcessor ?? frameProcessor}
          onLayout={(event: LayoutChangeEvent) => {
            setPixelRatio(
              event.nativeEvent.layout.width /
                PixelRatio.getPixelSizeForLayoutSize(
                  event.nativeEvent.layout.width,
                ),
            );
          }}
        />
      ) : undefined}
      <View style={[styles.boundingBox]} />
      {enableBoundingBox && ocrElements.length > 0 ? (
        <View style={boundingStyle} testID="faceDetectionBoxView">
          {frameDimensions &&
            (() => {
              const {adjustRect} = boundingBoxAdjustToView(
                frameDimensions,
                {
                  width: landscapeMode ? screenHeight : screenWidth,
                  height: landscapeMode ? screenWidth : screenHeight,
                },
                landscapeMode,
                boundingBoxVerticalPadding,
                boundingBoxHorizontalPadding,
              );
              return ocrElements
                ? ocrElements.map((i, index) => {
                    const adjusted = adjustRect(i);
                    return (
                      <View
                        key={index}
                        style={[
                          styles.boundingBox,
                          {
                            ...adjusted,
                          },
                          boundingBoxStyle,
                        ]}
                      />
                    );
                  })
                : undefined;
            })()}
        </View>
      ) : null}
      {photoSkipButton ? (
        <View style={[styles.fixToText]}>
          {photoSkipButtonEnabled ? (
            photoSkipButton ? (
              <TouchableOpacity onPress={photoSkipOnPress}>
                {photoSkipButton}
              </TouchableOpacity>
            ) : (
              <View style={[styles.skipButtonContainer, photoSkipButtonStyle]}>
                <Button
                  title={skipButtonText ? skipButtonText : 'Skip'}
                  onPress={photoSkipOnPress}
                />
              </View>
            )
          ) : undefined}
        </View>
      ) : undefined}
      {feedbackText ? (
        <View style={styles.feedbackContainer}>
          <Text style={styles.feedbackText}>{feedbackText}</Text>
        </View>
      ) : null}
    </View>
  );
};

export default MRZCamera;
