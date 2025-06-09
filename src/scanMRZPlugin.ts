import type {Frame} from 'react-native-vision-camera';
import type {MRZFrame} from './types/types';

export default function scanMRZ(frame: Frame): MRZFrame {
  'worklet';
  // Esta función debe estar registrada como global en babel.config.js
  // y compilada correctamente desde C++/Rust/JS según el origen del plugin
  // @ts-ignore
  return __scanMRZ(frame);
}
