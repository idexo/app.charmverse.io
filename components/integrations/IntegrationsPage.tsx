import { useEffect } from 'react';

import charmClient from 'charmClient';
import { AccountSettings } from 'components/settings/AccountSettings';
import Legend from 'components/settings/Legend';

import MultiSigList from './components/GnosisSafes';
import { IdentityProviders } from './components/IdentityProviders';

export function IntegrationSettings() {
  useEffect(() => {
    charmClient.track.trackAction('page_view', { type: 'integrations' });
  }, []);

  return (
    <>
      <Legend>My Account</Legend>
      <IdentityProviders />
      <AccountSettings />
      <MultiSigList />
    </>
  );
}
