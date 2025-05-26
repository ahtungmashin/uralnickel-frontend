let idleTimeout = null;
const IDLE_LIMIT = 30 * 60 * 1000; // 30 минут

export function startIdleTimer(onTimeout) {
  const events = ['mousemove', 'keydown', 'click', 'scroll'];
  const resetTimer = () => {
    clearTimeout(idleTimeout);
    idleTimeout = setTimeout(() => {
      onTimeout();
    }, IDLE_LIMIT);
  };

  events.forEach(event => {
    window.addEventListener(event, resetTimer);
  });

  resetTimer(); // стартуем

  return () => {
    clearTimeout(idleTimeout);
    events.forEach(event => {
      window.removeEventListener(event, resetTimer);
    });
  };
}
