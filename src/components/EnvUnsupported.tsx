import { Placeholder, AppRoot } from '@telegram-apps/telegram-ui';
import { retrieveLaunchParams, isColorDark, isRGB } from '@telegram-apps/sdk-react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

export function EnvUnsupported() {
  const { t } = useTranslation();
  const [platform, isDark] = useMemo(() => {
    let platform = 'base';
    let isDark = false;
    try {
      const lp = retrieveLaunchParams();
      const { bgColor } = lp.themeParams;
      platform = lp.platform;
      isDark = bgColor && isRGB(bgColor) ? isColorDark(bgColor) : false;
    } catch { /* empty */
    }

    return [platform, isDark];
  }, []);

  return (
    <AppRoot
      appearance={isDark ? 'dark' : 'light'}
      platform={['macos', 'ios'].includes(platform) ? 'ios' : 'base'}
    >
      <Placeholder
        header={t('Oops')}
        description={t('You are using too old Telegram client to run this application')}
      >
        <img
          alt={t('Telegram sticker')}
          src="https://xelene.me/telegram.gif"
          style={{ display: 'block', width: '144px', height: '144px' }}
        />
      </Placeholder>
    </AppRoot>
  );
}
