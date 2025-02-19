import { InvalidInputError } from '@charmverse/core/errors';
import { resolvePageTree } from '@charmverse/core/pages';
import { prisma } from '@charmverse/core/prisma-client';

import type { Formatters, PropertyContext } from 'components/common/BoardEditor/focalboard/src/octoUtils';
import { OctoUtils } from 'components/common/BoardEditor/focalboard/src/octoUtils';
import { Utils } from 'components/common/BoardEditor/focalboard/src/utils';
import type { PageListItemsRecord } from 'components/common/BoardEditor/interfaces';
import { CardFilter } from 'lib/focalboard/cardFilter';
import type { FilterGroup } from 'lib/focalboard/filterGroup';
import { permissionsApiClient } from 'lib/permissions/api/client';
import { formatDate, formatDateTime } from 'lib/utils/dates';

import type { Board, BoardFields, IPropertyTemplate, PropertyType } from './board';
import type { BoardView, BoardViewFields } from './boardView';
import type { Card, CardFields } from './card';
import { Constants } from './constants';
import { getRelationPropertiesCardsRecord } from './getRelationPropertiesCardsRecord';

export async function loadAndGenerateCsv({
  databaseId,
  userId,
  customFilter
}: {
  databaseId?: string;
  userId: string;
  customFilter?: FilterGroup | null;
}): Promise<{ csvData: string; childPageIds: string[] }> {
  if (!databaseId) {
    throw new InvalidInputError('databaseId is required');
  }

  const { targetPage, flatChildren } = await resolvePageTree({ pageId: databaseId, flattenChildren: true });

  const accessibleCardIds = await permissionsApiClient.pages
    .bulkComputePagePermissions({
      userId,
      pageIds: flatChildren.map((c) => c.id)
    })
    .then((permissions) =>
      Object.entries(permissions)
        .filter(([pageId, computed]) => !!computed.read)
        .map(([pageId]) => pageId)
    );

  const space = await prisma.space.findUniqueOrThrow({
    where: {
      id: targetPage.spaceId
    },
    select: {
      domain: true
    }
  });

  const [boardBlocks, cardBlocks, cardPages] = await Promise.all([
    prisma.block.findMany({
      where: {
        rootId: targetPage.id,
        type: {
          in: ['board', 'view']
        }
      }
    }),
    prisma.block.findMany({
      where: {
        id: {
          in: accessibleCardIds
        },
        rootId: targetPage.id,
        type: 'card'
      },
      orderBy: {
        createdAt: 'asc'
      }
    }),
    // Necessary as card title may not be synced to page
    prisma.page
      .findMany({
        where: {
          id: {
            in: accessibleCardIds
          },
          parentId: targetPage.id,
          type: 'card'
        },
        select: {
          id: true,
          title: true
        }
      })
      .then((_cardPages) =>
        _cardPages.reduce((acc, page) => {
          acc[page.id] = {
            title: page.title
          };
          return acc;
        }, {} as Record<string, { title: string }>)
      )
  ]);

  cardBlocks.forEach((block) => {
    block.title = cardPages[block.id]?.title ?? 'Untitled';
  });

  const boardBlock = boardBlocks.find((block) => block.type === 'board');

  const viewBlocks = boardBlocks.filter((block) => block.type === 'view');
  const viewBlock: BoardView = (viewBlocks.find((block) => (block.fields as BoardViewFields).viewType === 'table') ||
    viewBlocks[0] ||
    boardBlocks[0]) as unknown as BoardView;

  if (customFilter && viewBlock?.fields) {
    viewBlock.fields.filter = customFilter;
  }

  const spaceMembers = await prisma.user
    .findMany({
      where: {
        spaceRoles: {
          some: {
            spaceId: targetPage.spaceId
          }
        }
      },
      select: {
        id: true,
        username: true
      }
    })
    .then((users) =>
      users.reduce((acc, user) => {
        acc[user.id] = {
          username: user.username
        };
        return acc;
      }, {} as Record<string, { username: string }>)
    );

  const relationProperties = (boardBlock?.fields as unknown as BoardFields).cardProperties.filter(
    (property) => property.type === 'relation'
  );

  const cardPropertyPageIds: string[] = [];

  relationProperties.forEach((relationProperty) => {
    cardBlocks.forEach((cardBlock) => {
      const connectedPageIds = (cardBlock.fields as CardFields).properties[relationProperty.id] as string[];
      if (connectedPageIds?.length) {
        cardPropertyPageIds.push(...connectedPageIds);
      }
    });
  });

  const connectedAccessiblePageIds = await permissionsApiClient.pages
    .bulkComputePagePermissions({
      userId,
      pageIds: cardPropertyPageIds
    })
    .then((permissions) =>
      Object.entries(permissions)
        .filter(([pageId, computed]) => !!computed.read)
        .map(([pageId]) => pageId)
    );

  const connectedPages = await prisma.page.findMany({
    where: {
      id: {
        in: connectedAccessiblePageIds
      }
    },
    select: {
      id: true,
      title: true,
      type: true,
      path: true,
      parentId: true,
      icon: true,
      hasContent: true
    }
  });

  const relationPropertiesCardsRecord = boardBlock
    ? getRelationPropertiesCardsRecord({
        properties: (boardBlock.fields as unknown as BoardFields)?.cardProperties ?? [],
        pages: connectedPages
      })
    : {};

  const csvData = generateCSV(
    boardBlock as any,
    viewBlock as any,
    cardBlocks as any,
    {
      date: formatDate,
      dateTime: formatDateTime
    },
    {
      users: spaceMembers,
      spaceDomain: space.domain
    },
    relationPropertiesCardsRecord
  );

  return {
    csvData: csvData.csvContent,
    childPageIds: csvData.rowIds
  };
}

function generateCSV(
  board: Pick<Board, 'fields'>,
  view: BoardView,
  cards: Card[],
  formatters: Formatters,
  context: PropertyContext,
  relationPropertiesCardsRecord: PageListItemsRecord
) {
  const { rows, rowIds } = generateTableArray(board, cards, view, formatters, context, relationPropertiesCardsRecord);
  let csvContent = '';

  rows.forEach((row) => {
    const encodedRow = row.join(',');
    csvContent += `${encodedRow}\r\n`;
  });

  let fileTitle = view.title;
  if (view.fields.sourceType === 'google_form') {
    fileTitle = `Responses to ${view.fields.sourceData?.formName}`;
  }

  const filename = `${Utils.sanitizeFilename(fileTitle || 'CharmVerse Table Export')}.csv`;

  return {
    filename,
    csvContent,
    rowIds
  };
}

function encodeText(text: string): string {
  return text.replace(/"/g, '""');
}

function generateTableArray(
  board: Pick<Board, 'fields'>,
  cards: Card[],
  viewToExport: BoardView,
  formatters: Formatters,
  context: PropertyContext,
  relationPropertiesCardsRecord: PageListItemsRecord
): { rows: string[][]; rowIds: string[] } {
  const rows: string[][] = [];
  const cardProperties = board.fields.cardProperties as IPropertyTemplate[];

  const filterGroup = viewToExport.fields.filter || { filters: [] };
  const filteredCards = CardFilter.applyFilterGroup(filterGroup, cardProperties, cards) || [];

  if (
    viewToExport.fields.viewType === 'calendar' &&
    viewToExport.fields.dateDisplayPropertyId &&
    !viewToExport.fields.visiblePropertyIds.includes(viewToExport.fields.dateDisplayPropertyId)
  ) {
    const dateDisplay = board.fields.cardProperties.find(
      (template: IPropertyTemplate) => viewToExport.fields.dateDisplayPropertyId === template.id
    );
    if (dateDisplay) {
      cardProperties.push(dateDisplay);
    }
  }

  const titleProperty = cardProperties.find((prop) => prop.id === Constants.titleColumnId);
  // Header row
  const row: string[] = titleProperty ? [] : ['Title'];
  cardProperties.forEach((template: IPropertyTemplate) => {
    row.push(template.name);
  });
  rows.push(row);

  filteredCards.forEach((card) => {
    const rowColumns = getCSVColumns({
      card,
      context,
      formatters,
      hasTitleProperty: !!titleProperty,
      visibleProperties: cardProperties,
      relationPropertiesCardsRecord
    });
    rows.push(rowColumns);
  });

  return { rows, rowIds: filteredCards.map(({ id }) => id) };
}

export function getCSVColumns({
  card,
  context,
  formatters,
  hasTitleProperty,
  visibleProperties,
  relationPropertiesCardsRecord
}: {
  relationPropertiesCardsRecord: PageListItemsRecord;
  card: Card;
  context: PropertyContext;
  formatters: Formatters;
  hasTitleProperty: boolean;
  visibleProperties: IPropertyTemplate<PropertyType>[];
}) {
  const columns: string[] = [];
  if (!hasTitleProperty) {
    columns.push(`"${encodeText(card.title)}"`);
  }
  visibleProperties.forEach((propertyTemplate: IPropertyTemplate) => {
    const propertyValue = card.fields.properties[propertyTemplate.id];
    const displayValue =
      OctoUtils.propertyDisplayValue({
        block: card,
        context,
        propertyValue,
        propertyTemplate,
        formatters,
        relationPropertiesCardsRecord
      }) || '';
    if (propertyTemplate.id === Constants.titleColumnId) {
      columns.push(`"${encodeText(card.title)}"`);
    } else if (
      propertyTemplate.type === 'number' ||
      propertyTemplate.type === 'proposalEvaluationAverage' ||
      propertyTemplate.type === 'proposalEvaluationTotal'
    ) {
      const numericValue = propertyValue ? Number(propertyValue).toString() : '';
      columns.push(numericValue);
    } else if (
      propertyTemplate.type === 'multiSelect' ||
      propertyTemplate.type === 'person' ||
      propertyTemplate.type === 'proposalEvaluatedBy' ||
      propertyTemplate.type === 'proposalAuthor' ||
      propertyTemplate.type === 'proposalReviewer' ||
      propertyTemplate.type === 'relation'
    ) {
      const multiSelectValue = (((displayValue as unknown) || []) as string[]).join('|');
      columns.push(multiSelectValue);
    } else {
      // Export as string
      columns.push(`"${encodeText(displayValue as string)}"`);
    }
  });
  return columns;
}
