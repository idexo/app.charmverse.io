import type { SpaceDataExport } from './exportSpaceData';

export type ImportParams = {
  targetSpaceIdOrDomain: string;
  exportData?: Partial<SpaceDataExport>;
  exportName?: string;
};

/**
 * A hashmap generated by importing data, giving the source record id as keys and the created record ids as values
 *
 * @example {oldPageid: newPageId} OR {oldRoleId: newRoleId}
 */
export type OldNewIdHashMap = {
  oldNewRecordIdHashMap: Record<string, string>;
};
