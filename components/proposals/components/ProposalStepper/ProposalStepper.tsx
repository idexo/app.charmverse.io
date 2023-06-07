import { DesktopStepper } from './DesktopStepper';
import type { StepperProps } from './interfaces';
import { MobileStepper } from './MobileStepper';

export function ProposalStepper({
  proposalStatus,
  openVoteModal,
  updateProposalStatus,
  proposalFlowPermissions
}: StepperProps) {
  return (
    <>
      <DesktopStepper
        proposalStatus={proposalStatus}
        openVoteModal={openVoteModal}
        updateProposalStatus={updateProposalStatus}
        proposalFlowPermissions={proposalFlowPermissions}
      />
      <MobileStepper
        proposalStatus={proposalStatus}
        openVoteModal={openVoteModal}
        updateProposalStatus={updateProposalStatus}
        proposalFlowPermissions={proposalFlowPermissions}
      />
    </>
  );
}
