import { hasAccessToSpace, isProposalAuthor } from '@charmverse/core/permissions';
import type { Proposal, ProposalAuthor } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';

import { permissionsApiClient } from 'lib/permissions/api/client';

export async function canAccessPrivateFields({
  proposalId,
  userId,
  proposal
}: {
  proposalId: string;
  userId?: string;
  proposal?: Pick<Proposal, 'createdBy' | 'formId' | 'spaceId' | 'id'> & { authors: ProposalAuthor[] };
}) {
  if (!userId) {
    return false;
  }

  const checkProposal =
    proposal || (await prisma.proposal.findUnique({ where: { id: proposalId }, include: { authors: true } }));

  if (!checkProposal) {
    return false;
  }

  if (!checkProposal.formId) {
    return false;
  }

  // authors can view private fields
  const isAuthor = isProposalAuthor({ proposal: checkProposal, userId });
  if (isAuthor) {
    return true;
  }

  // admins can view private fields
  const { isAdmin } = await hasAccessToSpace({ spaceId: checkProposal.spaceId, userId });
  if (isAdmin) {
    return true;
  }

  const permissions = await permissionsApiClient.proposals.computeProposalPermissions({
    resourceId: checkProposal.id,
    userId
  });

  // reviewers can view private fields
  return permissions.review || permissions.evaluate;
}
