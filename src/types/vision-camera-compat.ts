export type FrameProcessorPlugin = (frame: any) => any;

declare global {
  function registerPlugin(name: string, plugin: FrameProcessorPlugin): void;
}
