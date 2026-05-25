import { DefaultConfigPopover } from "../default-config-popover";
import type { PropDef, SectionProps } from "../props/types";

export function Section({ id, title, eyebrow, children }: SectionProps) {
  return (
    <section id={id} className="scroll-mt-24 py-4 first:pt-0">
      <div className="mb-6 flex items-end justify-between gap-4 border-b border-foreground/10 pb-3">
        <div>
          {eyebrow ? (
            <p className="docs-eyebrow text-[0.68rem] font-normal uppercase tracking-[0.16em] text-foreground/38">
              {eyebrow}
            </p>
          ) : null}
          <h2 className="text-2xl leading-[1.05] text-foreground">{title}</h2>
        </div>
        <a
          href={`#${id}`}
          className="hidden text-[0.7rem] font-semibold text-foreground/36 transition-colors hover:text-foreground sm:block"
        >
          #{id}
        </a>
      </div>
      {children}
    </section>
  );
}

export function PropTable({ props }: { props: PropDef[] }) {
  return (
    <div className="custom-scrollbar overflow-x-auto rounded-[6px] border border-foreground/10 bg-background">
      <table className="min-w-[44rem] w-full text-left text-xs">
        <thead className="bg-foreground/[0.035] text-foreground/48">
          <tr>
            <th className="px-3 py-2 font-semibold">Name</th>
            <th className="px-3 py-2 font-semibold">Type</th>
            <th className="hidden px-3 py-2 font-semibold sm:table-cell">
              Default
            </th>
            <th className="px-3 py-2 font-semibold">Description</th>
          </tr>
        </thead>
        <tbody>
          {props.map((prop) => (
            <tr key={prop.name} className="border-t border-foreground/8">
              <td className="px-3 py-2 font-mono text-[0.72rem] font-semibold text-foreground">
                {prop.name}
              </td>
              <td className="max-w-48 px-3 py-2 font-mono text-[0.68rem] text-foreground/55">
                {prop.type}
              </td>
              <td className="hidden px-3 py-2 font-mono text-[0.68rem] sm:table-cell">
                {prop.default ? (
                  prop.defaultPreview === "default-config" ? (
                    <DefaultConfigPopover label={prop.default} />
                  ) : (
                    <span className="text-foreground/42">{prop.default}</span>
                  )
                ) : (
                  <span className="text-foreground/42">-</span>
                )}
              </td>
              <td className="px-3 py-2 text-foreground/66">
                {prop.description}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
