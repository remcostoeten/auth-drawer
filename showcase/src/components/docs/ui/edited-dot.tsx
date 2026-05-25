export function EditedDot({ onReset }: { onReset: () => void }) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onReset();
      }}
      className="group -ml-0.5 mr-1 inline-flex items-center justify-center"
      title="Reset to default"
    >
      <span className="h-1.5 w-1.5 rounded-full bg-blue-500/70 transition-[background-color,transform] duration-100 group-hover:bg-blue-500 group-active:scale-90" />
    </button>
  );
}
