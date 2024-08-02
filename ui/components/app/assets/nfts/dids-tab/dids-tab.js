import React, { useContext, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import {
  AlignItems,
  Display,
  FlexDirection,
  JustifyContent,
  Size,
  TextAlign,
  TextColor,
  TextVariant,
  BlockSize,
} from '../../../../../helpers/constants/design-system';
import { SECURITY_ROUTE } from '../../../../../helpers/constants/routes';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import {
  getCurrentNetwork,
  getIsMainnet,
} from '../../../../../selectors';
import { Box, ButtonLink, IconName, Text, Label, TextField, HelpText, HelpTextSeverity, TextFieldSize, TextFieldType } from '../../../../component-library';
import Spinner from '../../../../ui/spinner';
import { fetchSbtTokens, showImportDidModal } from '../../../../../store/actions';
import { MetaMetricsContext } from '../../../../../contexts/metametrics';
import { ORIGIN_METAMASK } from '../../../../../../shared/constants/app';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventKeyType,
  MetaMetricsEventName,
} from '../../../../../../shared/constants/metametrics';
import { getCurrentLocale } from '../../../../../ducks/locale/locale';

// Local Storage 관련
import { getMostRecentOverviewPage } from '../../../../../ducks/history/history';
import { requestRevealSeedWords } from '../../../../../store/actions';
import { Tab, Tabs } from '../../../../../components/ui/tabs';
import { ExportTextContainer } from '../../../../../components/ui/export-text-container';
import HoldToRevealModal from '../../../../../components/app/modals/hold-to-reveal-modal/hold-to-reveal-modal';

const PASSWORD_PROMPT_SCREEN = 'PASSWORD_PROMPT_SCREEN';
const REVEAL_SEED_SCREEN = 'REVEAL_SEED_SCREEN';

export default function DidsTab() {
  const [localDids, setLocalDids] = useState([]);
  const isMainnet = useSelector(getIsMainnet);
  const history = useHistory();
  const t = useI18nContext();
  const dispatch = useDispatch();
  const trackEvent = useContext(MetaMetricsContext);
  const { chainId, nickname } = useSelector(getCurrentNetwork);
  const currentLocale = useSelector(getCurrentLocale);
  const sbtTokens = useSelector(state => state.metamask.sbtTokens || []);
  const fetchingDids = useSelector(state => state.metamask.fetchingDids || false);

  useEffect(() => {
    if (isMainnet) {
      dispatch(fetchSbtTokens());
    }
    const storedDids = JSON.parse(localStorage.getItem('dids') || '[]');
    setLocalDids(storedDids);
  }, [dispatch, isMainnet]);

  useEffect(() => {
    if (!fetchingDids) {
      trackEvent({
        event: MetaMetricsEventName.EmptyDidsBannerDisplayed,
        category: MetaMetricsEventCategory.Navigation,
        properties: {
          chain_id: chainId,
          locale: currentLocale,
          network: nickname,
          referrer: ORIGIN_METAMASK,
        },
      });
    }
  }, [fetchingDids, trackEvent, chainId, nickname, currentLocale]);

  if (fetchingDids) {
    return (
      <Box className="dids-tab__loading">
        <Spinner
          color="var(--color-warning-default)"
          className="loading-overlay__spinner"
        />
      </Box>
    );
  }

  const hasAnyDids = sbtTokens.length > 0 || localDids.length > 0;
  const showDidBanner = !hasAnyDids;

  // Local Storage 관련
  const [screen, setScreen] = useState(PASSWORD_PROMPT_SCREEN);
  const [password, setPassword] = useState('');
  const [seedWords, setSeedWords] = useState(null);
  const [completedLongPress, setCompletedLongPress] = useState(false);
  const [error, setError] = useState(null);
  const mostRecentOverviewPage = useSelector(getMostRecentOverviewPage);
  const [isShowingHoldModal, setIsShowingHoldModal] = useState(false);

  const handleSubmit = (event) => {
    event.preventDefault();
    setSeedWords(null);
    setCompletedLongPress(false);
    setError(null);
    dispatch(requestRevealSeedWords(password))
      .then((revealedSeedWords) => {
        trackEvent({
          category: MetaMetricsEventCategory.Keys,
          event: MetaMetricsEventName.KeyExportRevealed,
          properties: {
            key_type: MetaMetricsEventKeyType.Srp,
          },
        });
        setSeedWords(revealedSeedWords);

        setIsShowingHoldModal(true);
      })
      .catch((e) => {
        trackEvent({
          category: MetaMetricsEventCategory.Keys,
          event: MetaMetricsEventName.KeyExportFailed,
          properties: {
            key_type: MetaMetricsEventKeyType.Srp,
            reason: e.message, // 'incorrect_password',
          },
        });
        setError(e.message);
      });
  };

  const renderPasswordPromptContent = () => {
    return (
      <form onSubmit={handleSubmit}>
        <Label htmlFor="password-box">{t('enterPasswordContinue')}</Label>
        <TextField
          inputProps={{
            'data-testid': 'input-password',
          }}
          type={TextFieldType.Password}
          placeholder={t('makeSureNoOneWatching')}
          id="password-box"
          size={TextFieldSize.Large}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          error={Boolean(error)}
          width={BlockSize.Full}
        />
        {error && (
          <HelpText severity={HelpTextSeverity.Danger}>{error}</HelpText>
        )}
      </form>
    );
  };

  const renderDidContent = () => {
    return hasAnyDids
    ? (
      <Box>
        <Box>
          <Text
            variant={TextVariant.headingSm}
            align={TextAlign.Center}
            as="h4"
          >
            {t('sbtTokens')}
          </Text>
          {sbtTokens.map((token) => (
            <Box key={token.tokenId} className="dids-tab__item">
              <Text>{token.name}</Text>
              <Text>{token.description}</Text>
            </Box>
          ))}
        </Box>
        <Box>
          <Text
            variant={TextVariant.headingSm}
            align={TextAlign.Center}
            as="h4"
          >
            {t('localDids')}
          </Text>
          {localDids.map((did, index) => (
            <Box key={index} className="dids-tab__item">
              <Text>{did.id}</Text>
              <Text>{did.document}</Text>
            </Box>
          ))}
        </Box>
      </Box>
    )
    : (
      <Box
        padding={12}
        display={Display.Flex}
        flexDirection={FlexDirection.Column}
        alignItems={AlignItems.center}
        justifyContent={JustifyContent.center}
      >
        <Box justifyContent={JustifyContent.center}>
          <img src="./images/no-dids.svg" alt="No DIDs" />
        </Box>
        <Box
          marginTop={4}
          marginBottom={12}
          display={Display.Flex}
          justifyContent={JustifyContent.center}
          alignItems={AlignItems.center}
          flexDirection={FlexDirection.Column}
          className="dids-tab__link"
        >
          <Text
            color={TextColor.textMuted}
            variant={TextVariant.headingSm}
            align={TextAlign.Center}
            as="h4"
          >
            {t('noDIDs')}
          </Text>
        </Box>
      </Box>
    )
  };

  const renderRevealSeedContent = () => {
    // default for SRP_VIEW_SRP_TEXT event because this is the first thing shown after rendering
    trackEvent({
      category: MetaMetricsEventCategory.Keys,
      event: MetaMetricsEventName.SrpViewSrpText,
      properties: {
        key_type: MetaMetricsEventKeyType.Srp,
      },
    });

    return (
      <div>
        <Tabs
          defaultActiveTabName={t('revealSeedWordsText')}
          onTabClick={(tabName) => {
            if (tabName === 'text-seed') {
              trackEvent({
                category: MetaMetricsEventCategory.Keys,
                event: MetaMetricsEventName.SrpViewSrpText,
                properties: {
                  key_type: MetaMetricsEventKeyType.Srp,
                },
              });
            } else if (tabName === 'qr-srp') {
              trackEvent({
                category: MetaMetricsEventCategory.Keys,
                event: MetaMetricsEventName.SrpViewsSrpQR,
                properties: {
                  key_type: MetaMetricsEventKeyType.Srp,
                },
              });
            }
          }}
        >
          <Tab
            name={t('revealSeedWordsText')}
            className="reveal-seed__tab"
            activeClassName="reveal-seed__active-tab"
            tabKey="text-seed"
          >
            <Label marginTop={4}>{t('yourPrivateSeedPhrase')}</Label>
            <ExportTextContainer
              text={seedWords}
              onClickCopy={() => {
                trackEvent({
                  category: MetaMetricsEventCategory.Keys,
                  event: MetaMetricsEventName.KeyExportCopied,
                  properties: {
                    key_type: MetaMetricsEventKeyType.Srp,
                    copy_method: 'clipboard',
                  },
                });
                trackEvent({
                  category: MetaMetricsEventCategory.Keys,
                  event: MetaMetricsEventName.SrpCopiedToClipboard,
                  properties: {
                    key_type: MetaMetricsEventKeyType.Srp,
                    copy_method: 'clipboard',
                  },
                });
              }}
            />
          </Tab>
          <Tab
            name={t('revealSeedWordsQR')}
            className="reveal-seed__tab"
            activeClassName="reveal-seed__active-tab"
            tabKey="qr-srp"
          >
            <Box
              display={Display.Flex}
              justifyContent={JustifyContent.center}
              alignItems={AlignItems.center}
              paddingTop={4}
              data-testid="qr-srp"
            >
              <div
                dangerouslySetInnerHTML={{
                  __html: renderQR().createTableTag(5, 15),
                }}
              />
            </Box>
          </Tab>
        </Tabs>
      </div>
    );
  };

  const renderContent = () => {
    return screen === PASSWORD_PROMPT_SCREEN || !completedLongPress
      ? renderPasswordPromptContent()
      : renderRevealSeedContent();
  };

  return (
    <Box className="dids-tab">
      <Box
      className="page-container"
      paddingTop={8}
      paddingBottom={8}
      paddingLeft={4}
      paddingRight={4}
      gap={4}
      >
      {renderContent()}
      <HoldToRevealModal
        isOpen={isShowingHoldModal}
        onClose={() => {
          trackEvent({
            category: MetaMetricsEventCategory.Keys,
            event: MetaMetricsEventName.SrpHoldToRevealCloseClicked,
            properties: {
              key_type: MetaMetricsEventKeyType.Srp,
            },
          });
          setIsShowingHoldModal(false);
        }}
        onLongPressed={() => {
          setCompletedLongPress(true);
          setIsShowingHoldModal(false);
          setScreen(REVEAL_SEED_SCREEN);
        }}
        holdToRevealType="SRP"
      />
      </Box>
      <Box
        className="dids-tab__buttons"
        display={Display.Flex}
        flexDirection={FlexDirection.Column}
        alignItems={AlignItems.flexStart}
        margin={4}
        gap={2}
        marginBottom={2}
      >
        <ButtonLink
          size={Size.MD}
          data-testid="import-did-button"
          startIconName={IconName.Add}
          onClick={() => {
            dispatch(showImportDidModal());
          }}
        >
          {t('importDID')}
        </ButtonLink>
      </Box>
    </Box>
  );
}
