import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

export type PageDim = { height: number; width: number };

export interface Spec extends TurboModule {
  getPageCount(source: string): Promise<number>;
  getPageSizes(source: string): Promise<PageDim[]>;
}

export default TurboModuleRegistry.getEnforcing<Spec>('NativePdfUtil');
