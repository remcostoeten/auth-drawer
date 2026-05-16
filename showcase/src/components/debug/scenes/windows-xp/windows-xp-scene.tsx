import type { ReactNode } from "react";
import "./windows-xp-scene.css";

type Props = {
  onOpenAuth: () => void;
  children?: ReactNode;
};

const USER = {
  id: "duck",
  name: "Duck",
  meta: "Local profile",
} as const;

function WindowsFlag() {
  return (
    <span className="xp-flag" aria-hidden="true">
      <span className="xp-flag__pane" />
      <span className="xp-flag__pane" />
      <span className="xp-flag__pane" />
      <span className="xp-flag__pane" />
    </span>
  );
}

function BootScreen() {
  return (
    <section className="xp-boot" aria-label="Windows XP boot screen">
      <div className="windows__bg">
        <div className="windows__bg--inner">
          <div className="windows__logo">
            <div className="windows__logo--inner red" />
            <div className="windows__logo--inner green" />
            <div className="windows__logo--inner blue" />
            <div className="windows__logo--inner yellow" />
          </div>
          <div className="windows__name">
            <p>Microsoft</p>
            <div className="windows__name--inner">
              Windows<span>xp</span>
            </div>
          </div>
          <div className="windows__bg--loading" aria-hidden="true">
            <ul>
              <li />
              <li />
              <li />
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

function LoginScreen({ children, onOpenAuth }: Props) {
  function openAuthDrawer() {
    onOpenAuth();
  }

  return (
    <section className="xp-login" aria-label="Windows XP login screen">
      <div className="xp-login__top" />
      <div className="xp-login__stage">
        <div className="xp-login__intro">
          <WindowsFlag />
          <div className="xp-login__intro-wordmark">
            <span className="xp-login__intro-microsoft">Microsoft</span>
            <span className="xp-login__intro-windows">Windows</span>
            <span className="xp-login__intro-xp">xp</span>
          </div>
          <p className="xp-login__hint">To begin, click your user name</p>
        </div>

        <span className="xp-login__divider" aria-hidden="true" />

        <div className="xp-login__users">
          <button
            type="button"
            className="xp-user xp-user--active"
            onClick={openAuthDrawer}
            aria-label={`Log in as ${USER.name}`}
          >
            <span className="xp-user__avatar">
              <img src="/duck.png" alt="" className="xp-user__avatar-img" />
            </span>
            <span className="xp-user__copy">
              <span className="xp-user__name">{USER.name}</span>
              <span className="xp-user__meta">{USER.meta}</span>
            </span>
            <span className="xp-user__pointer" aria-hidden="true" />
          </button>

          <div className="xp-login__auth-child" aria-hidden="true">
            {children}
          </div>
        </div>
      </div>
      <div className="xp-login__bottom">
        <button type="button" className="xp-login__power">
          <span className="xp-login__power-icon" aria-hidden="true">
            ○
          </span>
          Turn off computer
        </button>
        <p className="xp-login__footer-copy">
          After you log on, you can add or change accounts. Just go to Control Panel and click User
          Accounts.
        </p>
      </div>
    </section>
  );
}

export function WindowsXpScene({ children, onOpenAuth }: Props) {
  return (
    <div className="xp-scene">
      <LoginScreen onOpenAuth={onOpenAuth}>{children}</LoginScreen>
      <BootScreen />
    </div>
  );
}
