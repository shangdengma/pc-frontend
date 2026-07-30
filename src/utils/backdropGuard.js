export function createBackdropGuard() {
  let pointerStartedOnBackdrop = false

  function pointerDown(event) {
    pointerStartedOnBackdrop = event.target === event.currentTarget
  }

  function click(close) {
    const shouldClose = pointerStartedOnBackdrop
    pointerStartedOnBackdrop = false
    if (shouldClose && typeof close === 'function') close()
  }

  return { pointerDown, click }
}
