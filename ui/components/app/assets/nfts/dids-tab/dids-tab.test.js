import React from 'react';
import { renderWithProvider } from '../../../../../../test/jest';
import DidsTab from './dids-tab';
import configureStore from '../../../../../store/store';

const SBT_TOKENS = [
  {
    tokenId: '1',
    name: 'Token 1',
    description: 'Description for Token 1',
  },
  {
    tokenId: '2',
    name: 'Token 2',
    description: 'Description for Token 2',
  },
];

const LOCAL_DIDS = [
  {
    id: 'did:example:123456789abcdefghi',
    document: '{"@context":"https://www.w3.org/ns/did/v1","id":"did:example:123456789abcdefghi"}',
  },
  {
    id: 'did:example:abcdefghi123456789',
    document: '{"@context":"https://www.w3.org/ns/did/v1","id":"did:example:abcdefghi123456789"}',
  },
];

// dids-tab.test.js
const render = ({ sbtTokens = SBT_TOKENS, localDids = LOCAL_DIDS }) => {
  const store = configureStore({
    metamask: {
      sbtTokens,
      network: {
        chainId: '1',  // 예시로 1을 사용
        nickname: 'Mainnet',
      },
      fetchingDids: false,
    },
  });

  localStorage.setItem('dids', JSON.stringify(localDids));

  return renderWithProvider(<DidsTab />, store);
};


describe('DidsTab', () => {
  it('should render SBT tokens and local DIDs', () => {
    const { getByText } = render({});
    expect(getByText('Token 1')).toBeInTheDocument();
    expect(getByText('Token 2')).toBeInTheDocument();
    expect(getByText('did:example:123456789abcdefghi')).toBeInTheDocument();
    expect(getByText('did:example:abcdefghi123456789')).toBeInTheDocument();
  });

  it('should render no DIDs message when there are no SBT tokens and no local DIDs', () => {
    const { getByText } = render({ sbtTokens: [], localDids: [] });
    expect(getByText('No DIDs')).toBeInTheDocument();
  });

  it('should open import DID modal when import button is clicked', () => {
    const { getByTestId } = render({});
    fireEvent.click(getByTestId('import-did-button'));
    expect(showImportDidModal).toHaveBeenCalled();
  });
});
