import * as React from 'react';
import { Link } from 'react-router-dom';
import { ExpandLess, ExpandMore, Menu } from '@mui/icons-material';
import { CSSObject, styled, Theme, useTheme } from '@mui/material/styles';
import MuiLink from '@mui/material/Link';
import Box from '@mui/material/Box';
import ListItem from '@mui/material/ListItem';
import MuiDrawer from '@mui/material/Drawer';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import List from '@mui/material/List';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import { NymLogo } from '@nymproject/react/logo/NymLogo';
import { BIG_DIPPER, NYM_WEBSITE } from '../api/constants';
import { useMainContext } from '../context/main';
import { MobileDrawerClose } from '../icons/MobileDrawerClose';
import { OverviewSVG } from '../icons/OverviewSVG';
import { NetworkComponentsSVG } from '../icons/NetworksSVG';
import { NodemapSVG } from '../icons/NodemapSVG';
import { Socials } from './Socials';
import { Footer } from './Footer';
import { DarkLightSwitchDesktop } from './Switch';

const drawerWidth = 300;

const openedMixin = (theme: Theme): CSSObject => ({
  width: drawerWidth,
  transition: theme.transitions.create('width', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.enteringScreen,
  }),
  overflowX: 'hidden',
});

const closedMixin = (theme: Theme): CSSObject => ({
  transition: theme.transitions.create('width', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  overflowX: 'hidden',
  width: `calc(${theme.spacing(7)} + 1px)`,
});

const DrawerHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  padding: theme.spacing(0, 1),
  height: 64,
}));

const Drawer = styled(MuiDrawer, {
  shouldForwardProp: (prop) => prop !== 'open',
})(({ theme, open }) => ({
  width: drawerWidth,
  flexShrink: 0,
  whiteSpace: 'nowrap',
  boxSizing: 'border-box',
  ...(open && {
    ...openedMixin(theme),
    '& .MuiDrawer-paper': openedMixin(theme),
  }),
  ...(!open && {
    ...closedMixin(theme),
    '& .MuiDrawer-paper': closedMixin(theme),
  }),
}));

type NavOptionType = {
  id: number;
  isActive?: boolean;
  url: string;
  title: string;
  Icon?: React.ReactNode;
  nested?: NavOptionType[];
  isExpandedChild?: boolean;
};

export const originalNavOptions: NavOptionType[] = [
  {
    id: 0,
    isActive: false,
    url: '/',
    title: 'Overview',
    Icon: <OverviewSVG />,
  },
  {
    id: 1,
    isActive: false,
    url: '/network-components',
    title: 'Network Components',
    Icon: <NetworkComponentsSVG />,
    nested: [
      {
        id: 3,
        url: '/network-components/mixnodes',
        title: 'Mixnodes',
      },
      {
        id: 4,
        url: '/network-components/gateways',
        title: 'Gateways',
      },
      {
        id: 5,
        url: `${BIG_DIPPER}/validators`,
        title: 'Validators',
      },
    ],
  },
  {
    id: 2,
    isActive: false,
    url: '/nodemap',
    title: 'Nodemap',
    Icon: <NodemapSVG />,
  },
];

type ExpandableButtonType = {
  id: number;
  title: string;
  url: string;
  isActive?: boolean;
  Icon?: React.ReactNode;
  nested?: NavOptionType[];
  isChild?: boolean;
  openDrawer: () => void;
  closeDrawer?: () => void;
  drawIsTempOpen: boolean;
  drawIsFixed: boolean;
  fixDrawerClose?: () => void;
  isMobile: boolean;
  setToActive: (num: number) => void;
};

export const ExpandableButton: React.FC<ExpandableButtonType> = ({
  id,
  url,
  setToActive,
  isActive,
  openDrawer,
  closeDrawer,
  drawIsTempOpen,
  drawIsFixed,
  fixDrawerClose,
  Icon,
  title,
  nested,
  isMobile,
  isChild,
}) => {
  const [dynamicStyle, setDynamicStyle] = React.useState({});
  const [nestedOptions, toggleNestedOptions] = React.useState(false);
  const [isExternal, setIsExternal] = React.useState<boolean>(false);
  const { palette } = useTheme();

  const handleClick = () => {
    setToActive(id);
    if (title === 'Network Components' && nested) {
      openDrawer();
      toggleNestedOptions(!nestedOptions);
    }
    if (!nested && !drawIsFixed) {
      closeDrawer?.();
    }
    if (!nested && isMobile) {
      fixDrawerClose?.();
    }
  };

  React.useEffect(() => {
    if (url) {
      setIsExternal(url.includes('http'));
    }
    if (nested) {
      setDynamicStyle({
        background: palette.nym.networkExplorer.nav.selected.main,
        borderRight: `3px solid ${palette.nym.highlight}`,
      });
    }
    if (isChild) {
      setDynamicStyle({
        background: palette.nym.networkExplorer.nav.selected.nested,
        fontWeight: 600,
      });
    }
    if (!nested && !isChild) {
      setDynamicStyle({
        background: palette.nym.networkExplorer.nav.selected.main,
        borderRight: `3px solid ${palette.nym.highlight}`,
      });
    }
  }, [url]);

  React.useEffect(() => {
    if (!drawIsTempOpen && nestedOptions) {
      toggleNestedOptions(false);
    }
  }, [drawIsTempOpen]);

  return (
    <>
      <ListItem
        disablePadding
        disableGutters
        component={!nested ? Link : 'div'}
        to={isExternal ? { pathname: url } : url}
        target={isExternal ? '_blank' : ''}
        sx={{
          borderBottom: isChild ? 'none' : '1px solid rgba(255, 255, 255, 0.1)',
          ...(isActive
            ? dynamicStyle
            : {
                background: palette.nym.networkExplorer.nav.background,
                borderRight: 'none',
              }),
        }}
      >
        <ListItemButton
          onClick={handleClick}
          sx={{
            pt: 2,
            pb: 2,
            background: isChild ? palette.nym.networkExplorer.nav.selected.nested : 'none',
          }}
        >
          <ListItemIcon>{Icon}</ListItemIcon>
          <ListItemText
            primary={title}
            sx={{
              color: palette.nym.networkExplorer.nav.text,
            }}
            primaryTypographyProps={{
              style: {
                fontWeight: isActive ? 600 : 400,
              },
            }}
          />
          {nested && nestedOptions && <ExpandLess />}
          {nested && !nestedOptions && <ExpandMore />}
        </ListItemButton>
      </ListItem>
      {nestedOptions &&
        nested?.map((each) => (
          <ExpandableButton
            id={each.id}
            url={each.url}
            key={each.title}
            title={each.title}
            openDrawer={openDrawer}
            drawIsTempOpen={drawIsTempOpen}
            closeDrawer={closeDrawer}
            setToActive={setToActive}
            drawIsFixed={drawIsFixed}
            fixDrawerClose={fixDrawerClose}
            isMobile={isMobile}
            isChild
          />
        ))}
    </>
  );
};

ExpandableButton.defaultProps = {
  Icon: null,
  nested: undefined,
  isChild: false,
  isActive: false,
  fixDrawerClose: undefined,
  closeDrawer: undefined,
};

export const Nav: React.FC = ({ children }) => {
  const { updateNavState, navState } = useMainContext();
  const [drawerIsOpen, setDrawerToOpen] = React.useState(false);
  const [fixedOpen, setFixedOpen] = React.useState(false);
  const theme = useTheme();

  const setToActive = (id: number) => {
    updateNavState(id);
  };

  const fixDrawerOpen = () => {
    setFixedOpen(true);
    setDrawerToOpen(true);
  };

  const fixDrawerClose = () => {
    setFixedOpen(false);
    setDrawerToOpen(false);
  };

  const tempDrawerOpen = () => {
    if (!fixedOpen) {
      setDrawerToOpen(true);
    }
  };

  const tempDrawerClose = () => {
    if (!fixedOpen) {
      setDrawerToOpen(false);
    }
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        sx={{
          background: theme.palette.nym.networkExplorer.topNav.appBar,
          borderRadius: 0,
        }}
      >
        <Toolbar
          disableGutters
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              ml: 0.5,
            }}
          >
            <IconButton component="a" href={NYM_WEBSITE} target="_blank">
              <NymLogo height="40px" width="40px" />
            </IconButton>
            <Typography
              variant="h6"
              noWrap
              sx={{
                color: theme.palette.nym.networkExplorer.nav.text,
                fontSize: '18px',
                fontWeight: 600,
              }}
            >
              <MuiLink component={Link} to="/" underline="none" color="inherit">
                Network Explorer
              </MuiLink>
            </Typography>
          </Box>
          <Box
            sx={{
              mr: 2,
              alignItems: 'center',
              display: 'flex',
            }}
          >
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'row',
                width: 'auto',
                pr: 0,
                pl: 2,
                justifyContent: 'flex-end',
                alignItems: 'center',
              }}
            >
              <Socials />
              <DarkLightSwitchDesktop defaultChecked />
            </Box>
          </Box>
        </Toolbar>
      </AppBar>
      <Drawer
        variant="permanent"
        open={drawerIsOpen}
        PaperProps={{
          style: {
            background: theme.palette.nym.networkExplorer.nav.background,
            borderRadius: 0,
          },
        }}
      >
        <DrawerHeader
          sx={{
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            justifyContent: 'flex-start',
            paddingLeft: 0,
          }}
        >
          <IconButton
            onClick={drawerIsOpen ? fixDrawerClose : fixDrawerOpen}
            sx={{
              padding: 1,
              ml: 1,
              color: theme.palette.nym.networkExplorer.nav.text,
            }}
          >
            {drawerIsOpen ? <MobileDrawerClose /> : <Menu />}
          </IconButton>
        </DrawerHeader>

        <List sx={{ pt: 0, pb: 0 }} onMouseEnter={tempDrawerOpen} onMouseLeave={tempDrawerClose}>
          {navState.map((props) => (
            <ExpandableButton
              key={props.url}
              closeDrawer={tempDrawerClose}
              drawIsTempOpen={drawerIsOpen}
              drawIsFixed={fixedOpen}
              fixDrawerClose={fixDrawerClose}
              openDrawer={tempDrawerOpen}
              setToActive={setToActive}
              isMobile={false}
              {...props}
            />
          ))}
        </List>
      </Drawer>
      <Box sx={{ width: '100%', py: 5, px: 6, mt: 7 }}>
        {children}
        <Footer />
      </Box>
    </Box>
  );
};
