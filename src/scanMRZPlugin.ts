import {FrameProcessorPlugin} from './types/vision-camera-compat';
import {__scanMRZ} from './util/wrapper';

const plugin: FrameProcessorPlugin = frame => {
  'worklet';
  return __scanMRZ(frame);
};

// 👇 Esta función está expuesta automáticamente a nivel global por VisionCamera
registerPlugin('scanMRZ', plugin);

export const registerScanMRZPlugin = () => {
  registerPlugin('scanMRZ', plugin);
};
