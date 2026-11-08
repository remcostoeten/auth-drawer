export function DrawerHandle() {
  return (
    <div
      class="sticky top-0 z-3 flex w-full cursor-grab justify-center pb-2 pt-3"
      aria-hidden="true"
    >
      <div class="h-1 w-10 rounded-none bg-overlay-text/40" />
    </div>
  );
}
