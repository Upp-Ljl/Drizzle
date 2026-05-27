'use client';

import { Dialog } from './ui/dialog';
import { Button } from './ui/button';
import { useAuth } from './auth-provider';

const INTENT_BLURB: Record<string, string> = {
  bet: '押注会落档为你的预测记录',
  flower: '献花会署你的名字',
  nominate: '提名会进本周候选池，署你的名字',
  epitaph: '墓志铭会署你的名字',
};

export function AuthModal() {
  const { isAuthModalOpen, closeAuthModal, pendingIntentKind, signInWithGitHub } = useAuth();

  const intentText = pendingIntentKind ? INTENT_BLURB[pendingIntentKind] : null;

  return (
    <Dialog
      open={isAuthModalOpen}
      onClose={closeAuthModal}
      title="登录留下你的预测"
    >
      <div className="space-y-4">
        {intentText && (
          <p className="text-sm text-muted leading-relaxed">
            {intentText}。登录后会自动接上你刚才的动作。
          </p>
        )}
        <Button
          variant="primary"
          className="w-full"
          onClick={() => void signInWithGitHub()}
          data-testid="auth-modal-github"
        >
          用 GitHub 登录
        </Button>
        <p className="text-xs text-muted/70 text-center">
          不登录也能浏览所有页面。只在你想留痕时才需要身份。
        </p>
      </div>
    </Dialog>
  );
}
