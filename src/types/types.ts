import type {StyleProp, ViewStyle} from 'react-native';
import type {CameraProps} from 'react-native-vision-camera';

// Camera and Scanner Props
export interface MRZCameraProps {
  /**
   * If true, the bounding box will be drawn around the face detected.
   */
  enableBoundingBox?: boolean;
  /**
   * The color of the bounding box.
   */
  boundingBoxStyle?: StyleProp<ViewStyle>;
  /**
   * The vertical padding of the bounding box.
   */
  boundingBoxVerticalPadding?: number;
  /**
   * The horizontal padding of the bounding box.
   */
  boundingBoxHorizontalPadding?: number;
  /**
   * The style of the component.
   */
  style?: StyleProp<ViewStyle>;
  /**
   * If true, the photo skip button will be enabled.
   */
  skipButtonEnabled?: boolean;
  /**
   * The component to use as the photo skip button.
   */
  skipButton?: React.ReactNode;
  /**
   * callback function to skip the photo
   * @returns
   */
  onSkipPressed?: () => void;
  /**
   * The style of the photo skip button.
   */
  skipButtonStyle?: StyleProp<ViewStyle>;
  /**
   * The text of the photo skip button.
   */
  skipButtonText?: string;
  /**
   * all options for the camera
   */
  cameraProps?: Partial<CameraProps>;
  onData?: (lines: string[]) => void;
  scanSuccess?: boolean;
  cameraDirection?: 'front' | 'back'; // defaults to back
  isActiveCamera?: boolean;
}

export type MRZScannerProps = MRZCameraProps & {
  /**
   * callback function to get the final MRZ results
   * @param mrzResults
   * @returns
   */
  mrzFinalResults: (mrzResults: MRZProperties) => void | Promise<void>;
  /**
   * If true, the MRZ feedback will be enabled.
   */
  enableMRZFeedBack?: boolean;
  /**
   * number of QAs to be checked
   * @default 3
   */
  numberOfQAChecks?: number;
  mrzFeedbackCompletedColor?: string;
  mrzFeedbackUncompletedColor?: string;
  mrzFeedbackContainer?: StyleProp<ViewStyle>;
  mrzFeedbackTextStyle?: StyleProp<ViewStyle>;
};

// MRZ Data Types
export type MRZProperties = {
  docMRZ: string;
  docType?:
    | 'ADIT_STAMP'
    | 'ALIEN_REGISTRATION'
    | 'BIRTH_CERTIFICATE'
    | 'BORDER_CROSSING_CARD'
    | 'CEDULA'
    | 'CERTIFICATE_OF_NATURALIZATION'
    | 'CITIZENSHIP_CARD'
    | 'DRIVERS_LICENSE'
    | 'DSP150_FORM'
    | 'EMPLOYEE_AUTHORIZATION'
    | 'GOVERNMENT_ISSUED_ID'
    | 'I512'
    | 'I551'
    | 'I94'
    | 'INTERPOL_NOTICE'
    | 'MILITARY_CARD'
    | 'NATIONAL_ID'
    | 'OTHER'
    | 'PASSPORT'
    | 'REENTRY_PERMIT'
    | 'REFUGEE_PERMIT'
    | 'REFUGEE_TRAVEL_DOCUMENT'
    | 'REFUGEE_ASYLEE'
    | 'TRANSPORTATION_LETTER'
    | 'TRIBAL_CARD'
    | 'TRUSTED_TRAVELER_CARD'
    | 'VISA'
    | 'VOTER_REGISTRATION'
    | 'ADVANCE_PAROLE_DOCUMENT'
    | 'EMPLOYEE_AUTHORIZATION_DOCUMENT'
    | 'PERMANENT_RESIDENT_CARD'
    | 'REFUGEE_TRAVEL_DOCUMENT_REENTRY_PERMIT';
  issuingCountry?: string;
  givenNames?: string;
  lastNames?: string;
  idNumber?: string;
  nationality?: string;
  dob?: string;
  gender?: string;
  docExpirationDate?: string;
  additionalInformation?: string;
};

// OCR and Text Recognition Types
export interface MRZFrame {
  result: {
    blocks: TextBlock[];
  };
}

export interface TextBlock {
  text: string;
  frame: BoundingFrame;
}

export interface TextElement {
  text: string;
  frame: BoundingFrame;
  cornerPoints: Point[];
}

export interface TextLine {
  text: string;
  elements: TextElement[];
  frame: BoundingFrame;
  recognizedLanguages: string[];
  cornerPoints: Point[];
}

export interface Text {
  text: string;
  blocks: TextBlock[];
}

// Geometry Types
export interface BoundingFrame {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Dimensions {
  width: number;
  height: number;
}

export interface Point {
  x: number;
  y: number;
}

export interface Size<T = number> {
  width: T;
  height: T;
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
  boundingCenterX: number;
  boundingCenterY: number;
  cornerPoints: Point[];
}

export interface OCRElement {
  type: 'block' | 'line' | 'element';
  index: number;
  bounds: {
    size: Size;
    origin: Point;
  };
  value: string;
}

export const boundingBoxAdjustToView = (
  frameDimensions: Dimensions,
  viewDimensions: Dimensions,
  isRotated: boolean,
  _verticalCropPadding: number = 0,
  _horizontalCropPadding: number = 0,
) => {
  const {width: frameWidth, height: frameHeight} = frameDimensions;
  const {width: viewWidth, height: viewHeight} = viewDimensions;

  const widthRatio = viewWidth / frameWidth;
  const heightRatio = viewHeight / frameHeight;

  const adjustRect = (rect: BoundingFrame) => {
    if (isRotated) {
      return {
        x: rect.y * widthRatio,
        y: rect.x * heightRatio,
        width: rect.height * widthRatio,
        height: rect.width * heightRatio,
      };
    }
    return {
      x: rect.x * widthRatio,
      y: rect.y * heightRatio,
      width: rect.width * widthRatio,
      height: rect.height * heightRatio,
    };
  };

  return {adjustRect};
};
