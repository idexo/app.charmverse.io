import type { MemberPropertyType } from '@charmverse/core/prisma';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import AlternateEmailIcon from '@mui/icons-material/AlternateEmail';
import ArrowDropDownCircleIcon from '@mui/icons-material/ArrowDropDownCircle';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import DriveFileRenameOutlineIcon from '@mui/icons-material/DriveFileRenameOutline';
import GithubIcon from '@mui/icons-material/GitHub';
import InsertPhotoIcon from '@mui/icons-material/InsertPhoto';
import LinkIcon from '@mui/icons-material/Link';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import ListIcon from '@mui/icons-material/List';
import MilitaryTechIcon from '@mui/icons-material/MilitaryTech';
import NumbersIcon from '@mui/icons-material/Numbers';
import PersonIcon from '@mui/icons-material/Person';
import PhoneIcon from '@mui/icons-material/Phone';
import SubjectIcon from '@mui/icons-material/Subject';
import TextIcon from '@mui/icons-material/TextFields';
import { ListItemIcon, ListItemText } from '@mui/material';
import type { ReactNode } from 'react';
import { FaGoogle, FaTelegramPlane, FaWallet } from 'react-icons/fa';
import { FaXTwitter } from 'react-icons/fa6';

import { UpgradeChip } from 'components/settings/subscription/UpgradeWrapper';
import { MEMBER_PROPERTY_CONFIG, PREMIUM_MEMBER_PROPERTIES } from 'lib/members/constants';
import DiscordIcon from 'public/images/logos/discord_logo.svg';

export const MemberPropertyIcons: Record<MemberPropertyType, ReactNode> = {
  text: <TextIcon fontSize='small' />,
  text_multiline: <SubjectIcon fontSize='small' />,
  number: <NumbersIcon fontSize='small' />,
  phone: <PhoneIcon fontSize='small' />,
  url: <LinkIcon fontSize='small' />,
  email: <AlternateEmailIcon fontSize='small' />,
  select: <ArrowDropDownCircleIcon fontSize='small' />,
  multiselect: <ListIcon fontSize='small' />,
  role: <MilitaryTechIcon fontSize='small' />,
  profile_pic: <InsertPhotoIcon fontSize='small' />,
  timezone: <AccessTimeIcon fontSize='small' />,
  discord: <DiscordIcon width={18.5} height={18.5} />,
  twitter: <FaXTwitter width={18.5} height={18.5} />,
  linked_in: <LinkedInIcon width={18.5} height={18.5} />,
  github: <GithubIcon fontSize='small' />,
  bio: <PersonIcon fontSize='small' />,
  join_date: <CalendarMonthIcon fontSize='small' />,
  google: <FaGoogle fontSize='small' />,
  telegram: <FaTelegramPlane fontSize='small' />,
  wallet: <FaWallet fontSize='small' />
};

type Props = {
  type: MemberPropertyType;
  name?: string;
};
export function MemberPropertyItem({ type, name }: Props) {
  return (
    <>
      <ListItemIcon>{MemberPropertyIcons[type]}</ListItemIcon>
      <ListItemText
        sx={{
          '& span': {
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }
        }}
      >
        {name ?? MEMBER_PROPERTY_CONFIG[type]?.label}
        {PREMIUM_MEMBER_PROPERTIES.includes(type) && <UpgradeChip upgradeContext='custom_roles' />}
      </ListItemText>
    </>
  );
}
