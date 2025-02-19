import type { Page } from '@charmverse/core/prisma';
import ListItemIcon from '@mui/material/ListItemIcon';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';

import type { PagePathType } from 'components/common/PageIcon';
import { PageIcon } from 'components/common/PageIcon';
import PageTitle from 'components/common/PageLayout/components/PageTitle';

export type PageListItem = Pick<Page, 'id' | 'title' | 'path' | 'hasContent' | 'icon'> & {
  type: PagePathType;
};

interface Props {
  activeItemIndex?: number;
  activePageId?: string;
  pages: PageListItem[];
  onSelectPage: (pageId: string, type: PageListItem['type'], path: string, title: string) => void;
  emptyText?: string;
  style?: React.CSSProperties;
}

export function PagesList({
  emptyText = 'No pages found',
  activeItemIndex = -1,
  activePageId,
  pages,
  onSelectPage,
  style
}: Props) {
  function isActive(pageId: string, index: number) {
    return pageId === activePageId || index === activeItemIndex;
  }
  if (pages.length === 0) {
    return (
      <Typography
        style={{
          marginLeft: 16,
          marginBottom: 8
        }}
        variant='subtitle2'
        color='secondary'
      >
        {emptyText}
      </Typography>
    );
  }

  return (
    <div style={style}>
      {pages.map((page, pageIndex) => (
        <MenuItem
          data-test={`page-option-${page.id}`}
          data-value={page.id}
          data-type={page.type}
          data-path={page.path}
          className={isActive(page.id, pageIndex) ? 'mention-selected' : ''}
          onClick={() => onSelectPage(page.id, page.type, page.path, page.title)}
          key={page.id}
          selected={isActive(page.id, pageIndex)}
        >
          <ListItemIcon>
            <PageIcon icon={page.icon} isEditorEmpty={!page.hasContent} pageType={page.type} />
          </ListItemIcon>
          <PageTitle hasContent={!page.title} sx={{ fontWeight: 'bold' }}>
            {page.title ? page.title : 'Untitled'}
          </PageTitle>
        </MenuItem>
      ))}
    </div>
  );
}
