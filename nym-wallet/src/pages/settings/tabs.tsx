import React from 'react';
import { Tab, Tabs as MuiTabs, Box } from '@mui/material';

export const Tabs: React.FC<{
  tabs: string[];
  selectedTab: number;
  disabled: boolean;
  onChange: (event: React.SyntheticEvent, tab: number) => void;
}> = ({ tabs, selectedTab, disabled, onChange }) => (
  <MuiTabs
    value={selectedTab}
    onChange={onChange}
    sx={{ bgcolor: 'grey.200', borderTop: '1px solid', borderBottom: '1px solid', borderColor: 'grey.300' }}
    textColor="inherit"
  >
    {tabs.map((tabName) => (
      <Tab key={tabName} label={tabName} sx={{ textTransform: 'capitalize' }} disabled={disabled} />
    ))}
  </MuiTabs>
);

export const TabPanel: React.FC = ({ children }) => <Box sx={{ p: 4 }}>{children}</Box>;
