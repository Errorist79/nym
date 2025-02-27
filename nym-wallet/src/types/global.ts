import { Gateway, MajorCurrencyAmount, MixNode, PledgeData } from '@nymproject/types';

export enum EnumNodeType {
  mixnode = 'mixnode',
  gateway = 'gateway',
}

export type TNodeOwnership = {
  hasOwnership: boolean;
  nodeType?: EnumNodeType;
  vestingPledge?: PledgeData;
};

export type TPendingDelegation = {
  block_height: number;
};

export type TDelegation = {
  owner: string;
  node_identity: string;
  amount: MajorCurrencyAmount;
  block_height: number;
  proxy: string; // proxy address used to delegate the funds on behalf of another address
  pending?: TPendingDelegation;
};

export type TBondGatewayArgs = {
  gateway: Gateway;
  pledge: MajorCurrencyAmount;
  ownerSignature: string;
};

export type TBondMixNodeArgs = {
  mixnode: MixNode;
  pledge: MajorCurrencyAmount;
  ownerSignature: string;
};

export type TBondArgs = { type: EnumNodeType } & (TBondGatewayArgs | TBondMixNodeArgs);

export type TDelegateArgs = {
  identity: string;
  amount: MajorCurrencyAmount;
};

export type Period = 'Before' | { In: number } | 'After';

export type TAccount = {
  name: string;
  address: string;
  mnemonic: string;
};
