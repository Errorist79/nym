/* eslint-disable react/no-unused-prop-types */
import React from 'react';
import { Button, Stack } from '@mui/material';
import { SubtitleSlick, Title } from '../components';
import { TPages } from '../types';

export const WelcomeContent: React.FC<{
  page: TPages;
  onUseExisting: () => void;
  onCreateAccount: () => void;
}> = ({ onUseExisting, onCreateAccount }) => (
  <>
    <Title title="Welcome to NYM" />
    <SubtitleSlick subtitle="Next generation of privacy" />
    <Stack spacing={3} sx={{ width: 300 }}>
      <Button fullWidth variant="contained" color="primary" disableElevation size="large" onClick={onCreateAccount}>
        Create Account
      </Button>
      <Button
        fullWidth
        variant="outlined"
        size="large"
        sx={{
          color: 'common.white',
          border: '1px solid white',
          '&:hover': { border: '1px solid white', '&:hover': { background: 'none' } },
        }}
        onClick={onUseExisting}
        disableRipple
      >
        Use existing account
      </Button>
    </Stack>
  </>
);
