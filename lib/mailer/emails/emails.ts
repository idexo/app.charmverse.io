import type { User } from '@charmverse/core/prisma-client';
import { render } from '@react-email/render';
import { htmlToText } from 'html-to-text';
import type { ReactElement } from 'react';
import ReactDOMServer from 'react-dom/server';

import type { FeatureJson } from 'lib/features/constants';
import { getNotificationMetadata } from 'lib/notifications/getNotificationMetadata';
import type { Notification } from 'lib/notifications/interfaces';

import { PendingNotification } from './templates/NotificationTemplate';
import type { PageInviteEmailProps } from './templates/PageInviteEmail';
import { emailSubject, PageInviteEmail } from './templates/PageInviteEmail';

export function getPendingNotificationEmail({
  notification,
  spaceFeatures,
  user
}: {
  notification: Notification;
  user: Pick<User, 'id' | 'username' | 'id' | 'avatar'>;
  spaceFeatures: FeatureJson[];
}) {
  const html = render(PendingNotification({ notification, user, spaceFeatures }));
  const content = getNotificationMetadata({ notification, spaceFeatures }).content;
  const subject =
    typeof content === 'string' ? content : htmlToText(ReactDOMServer.renderToString(content as ReactElement));

  return { html, subject };
}

export function getPageInviteEmail(props: PageInviteEmailProps) {
  const html = render(PageInviteEmail(props));
  const subject = emailSubject(props);

  return { html, subject };
}
