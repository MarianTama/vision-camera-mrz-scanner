import type {CameraDevice} from 'react-native-vision-camera';

export const sortFormatsByResolution = (
  a: CameraDevice['formats'][0],
  b: CameraDevice['formats'][0],
) => {
  const aRes = a.videoWidth * a.videoHeight;
  const bRes = b.videoWidth * b.videoHeight;
  return bRes - aRes;
};
