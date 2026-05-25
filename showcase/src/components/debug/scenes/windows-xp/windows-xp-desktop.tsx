import { useEffect, useState } from "react";

const DESKTOP_ICONS = [
  { label: "My Computer", icon: "\u{1F4BB}" },
  { label: "Recycle Bin", icon: "\u{267B}\uFE0F" },
  { label: "Documents", icon: "\u{1F4C4}" },
  { label: "Network", icon: "\u{1F310}" },
];

function Clock() {
  const [time, setTime] = useState(() => {
    const now = new Date();
    return now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  });

  useEffect(() => {
    const id = setInterval(() => {
      const now = new Date();
      setTime(now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    }, 10000);
    return () => clearInterval(id);
  }, []);

  return <span className="xp-taskbar__clock">{time}</span>;
}

function StartMenu({ onClose }: { onClose: () => void }) {
  return (
    <>
      <div className="xp-start-backdrop" onClick={onClose} />
      <div className="xp-start">
        <div className="xp-start__rail">
          <span className="xp-start__rail-text">Duck</span>
        </div>
        <div className="xp-start__items">
          {["Programs", "Documents", "Settings", "Search", "Help and Support", "Run..."].map(
            (item) => (
              <button key={item} type="button" className="xp-start__item" onClick={onClose}>
                <span className="xp-start__item-label">{item}</span>
              </button>
            ),
          )}
        </div>
        <div className="xp-start__footer">
          <button type="button" className="xp-start__logout" onClick={onClose}>
            Log Off Duck
          </button>
          <button type="button" className="xp-start__shutdown" onClick={onClose}>
            Turn Off Computer
          </button>
        </div>
      </div>
    </>
  );
}

export function WindowsDesktop() {
  const [startOpen, setStartOpen] = useState(false);

  return (
    <section className="xp-desktop" aria-label="Windows XP desktop">
      <div className="windows_xp">
        <div className="xp-desktop__icon-wrapper">
          {DESKTOP_ICONS.map(({ label, icon }) => (
            <button key={label} type="button" className="xp-desktop__icon">
              <span className="xp-desktop__icon-img" aria-hidden="true">{icon}</span>
              <span className="xp-desktop__icon-label">{label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="xp-taskbar">
        <button
          type="button"
          className={startOpen ? "xp-start-btn xp-start-btn--active" : "xp-start-btn"}
          onClick={() => setStartOpen((o) => !o)}
        >
          <span className="xp-start-btn__icon" aria-hidden="true" />
          <span className="xp-start-btn__label">start</span>
        </button>

        <div className="xp-taskbar__divider" />

        <div className="xp-taskbar__tray">
          <Clock />
        </div>
      </div>

      {startOpen && <StartMenu onClose={() => setStartOpen(false)} />}
    </section>
  );
}
