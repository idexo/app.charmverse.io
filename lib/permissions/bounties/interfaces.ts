import type { BountyOperation, BountyPermissionLevel } from '@charmverse/core/prisma';

import type {
  UserPermissionFlags,
  TargetPermissionGroup,
  Resource,
  AssignablePermissionGroupsWithPublic
} from '../interfaces';

export type BountyPermissionFlags = UserPermissionFlags<BountyOperation>;

// Used for inserting and deleting permissions
export type BountyPermissionAssignment = {
  level: BountyPermissionLevel;
  assignee: TargetPermissionGroup;
} & Resource;

// Groups that can be assigned to various reward actions
export type BountyReviewer = Extract<AssignablePermissionGroupsWithPublic, 'role' | 'user'>;

export type BountySubmitter = Extract<AssignablePermissionGroupsWithPublic, 'space' | 'role'>;

export type BountyPermissionGroup = TargetPermissionGroup<BountyReviewer | BountySubmitter>;

// The set of all permissions for an individual reward
export type BountyPermissions = {
  reviewer: TargetPermissionGroup<BountyReviewer>[];
  creator: TargetPermissionGroup[];
  submitter: TargetPermissionGroup<BountySubmitter>[];
};

export interface AssignedBountyPermissions {
  bountyPermissions: BountyPermissions;
  userPermissions: BountyPermissionFlags;
}

export type BulkBountyPermissionAssignment = {
  bountyId: string;
  // We don't need resource id since the bountyId is global
  permissionsToAssign: Omit<BountyPermissionAssignment, 'resourceId'>[] | Partial<BountyPermissions>;
};

export interface InferredBountyPermissionMode {
  mode: BountySubmitter;
  roles?: string[];
}

// For now, we only want to write about who can submit, and who can review
export type SupportedHumanisedAccessConditions = Extract<BountyPermissionLevel, 'submitter' | 'reviewer'>;

export interface HumanisedBountyAccessSummary {
  permissionLevel: SupportedHumanisedAccessConditions;
  phrase: string;
  // Should be empty if the target permission level is accessible to the whole space
  roleNames: string[];
  // If all workspace members can perform this action, then the number is not provided, only if roles and people are selected
  totalPeople?: number;
}
