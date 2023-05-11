import { prisma, testUtilsMembers, testUtilsUser } from '@charmverse/core';
import type { Page, Role, Space, User } from '@charmverse/core/prisma';
import request from 'supertest';

import { upsertProposalCategoryPermission } from 'lib/permissions/proposals/upsertProposalCategoryPermission';
import { createProposalTemplate } from 'lib/templates/proposals/createProposalTemplate';
import { baseUrl, loginUser } from 'testing/mockApiCall';
import { generateProposalCategory } from 'testing/utils/proposals';

let space: Space;
let adminUser: User;
let nonAdminUser: User;
let reviewerRole: Role;

beforeAll(async () => {
  const generated = await testUtilsUser.generateUserAndSpace({ isAdmin: true });
  space = generated.space;
  adminUser = generated.user;
  nonAdminUser = await testUtilsUser.generateSpaceUser({
    isAdmin: false,
    spaceId: space.id
  });
  reviewerRole = await testUtilsMembers.generateRole({
    createdBy: adminUser.id,
    spaceId: space.id
  });
});

describe('POST /api/proposals/from-template - Instantiate a proposal template', () => {
  it('should copy a proposal from a template if the user can create proposals in this category and respond with 201', async () => {
    const proposalCategory = await generateProposalCategory({
      spaceId: space.id
    });

    await upsertProposalCategoryPermission({
      permissionLevel: 'full_access',
      proposalCategoryId: proposalCategory.id,
      assignee: {
        group: 'space',
        id: space.id
      }
    });

    const proposalTemplate = await createProposalTemplate({
      spaceId: space.id,
      userId: adminUser.id,
      categoryId: proposalCategory.id,
      reviewers: [
        {
          group: 'role',
          id: reviewerRole.id
        }
      ]
    });
    const nonAdminCookie = await loginUser(nonAdminUser.id);

    const createdProposal = (
      await request(baseUrl)
        .post('/api/proposals/from-template')
        .set('Cookie', nonAdminCookie)
        .send({
          templateId: proposalTemplate.id,
          spaceId: space.id
        })
        .expect(201)
    ).body as Page;

    const proposal = await prisma.proposal.findUnique({
      where: {
        id: createdProposal.proposalId as string
      },
      include: {
        reviewers: true
      }
    });

    expect(proposal?.reviewers?.length).toBe(1);
    expect(proposal?.reviewers?.some((r) => r.roleId === reviewerRole.id)).toBe(true);
    expect(proposal?.categoryId).toBe(proposalCategory.id);
  });

  it('should copy a proposal from a template if the user is an admin, even if there are no permissions for this category, and respond with 201', async () => {
    const proposalCategory = await generateProposalCategory({
      spaceId: space.id
    });

    const proposalTemplate = await createProposalTemplate({
      spaceId: space.id,
      userId: nonAdminUser.id,
      categoryId: proposalCategory.id,
      reviewers: [
        {
          group: 'role',
          id: reviewerRole.id
        }
      ]
    });
    const adminCookie = await loginUser(adminUser.id);

    const createdProposal = (
      await request(baseUrl)
        .post('/api/proposals/from-template')
        .set('Cookie', adminCookie)
        .send({
          templateId: proposalTemplate.id,
          spaceId: space.id
        })
        .expect(201)
    ).body as Page;

    const proposal = await prisma.proposal.findUnique({
      where: {
        id: createdProposal.proposalId as string
      },
      include: {
        reviewers: true
      }
    });

    expect(proposal?.reviewers?.length).toBe(1);
    expect(proposal?.reviewers?.some((r) => r.roleId === reviewerRole.id)).toBe(true);
    expect(proposal?.categoryId).toBe(proposalCategory.id);
  });

  it('should fail to create a proposal from a template if the user does not have create_proposal permission and respond with 401', async () => {
    const proposalCategory = await generateProposalCategory({
      spaceId: space.id
    });

    const proposalTemplate = await createProposalTemplate({
      spaceId: space.id,
      userId: nonAdminUser.id,
      categoryId: proposalCategory.id,
      reviewers: [
        {
          group: 'user',
          id: nonAdminUser.id
        }
      ]
    });

    const nonAdminCookie = await loginUser(nonAdminUser.id);
    await request(baseUrl)
      .post('/api/proposals/from-template')
      .set('Cookie', nonAdminCookie)
      .send({
        templateId: proposalTemplate.id,
        spaceId: space.id
      })
      .expect(401);
  });
});
