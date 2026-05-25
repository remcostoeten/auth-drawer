import { useConfigurator } from "../context";
import { CONFIGURATOR_DEFAULTS } from "../helpers";
import { ColorField, SliderField } from "../../ui/fields";

export function VisualConfiguratorTab() {
  const { backdrop, updateBackdrop, updateGradient } = useConfigurator();
  return (
  <div className="rounded-[8px] border border-foreground/10 bg-foreground/[0.025] p-4">
    <h3 className="docs-label mb-3 text-[0.66rem] font-normal uppercase text-foreground/42">
      ui.visual.backdrop
    </h3>
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
      <ColorField
        label="Color"
        value={backdrop.color}
        onChange={(v) => updateBackdrop("color", v)}
        isEdited={
          backdrop.color !== CONFIGURATOR_DEFAULTS.visual.backdrop.color
        }
        onReset={() =>
          updateBackdrop(
            "color",
            CONFIGURATOR_DEFAULTS.visual.backdrop.color,
          )
        }
      />
      <SliderField
        label="Opacity"
        value={backdrop.opacity}
        min={0}
        max={1}
        step={0.05}
        onChange={(v) => updateBackdrop("opacity", v)}
        isEdited={
          backdrop.opacity !==
          CONFIGURATOR_DEFAULTS.visual.backdrop.opacity
        }
        onReset={() =>
          updateBackdrop(
            "opacity",
            CONFIGURATOR_DEFAULTS.visual.backdrop.opacity,
          )
        }
      />
      <SliderField
        label="Blur (px)"
        value={backdrop.blur}
        min={0}
        max={24}
        step={1}
        onChange={(v) => updateBackdrop("blur", v)}
        isEdited={
          backdrop.blur !== CONFIGURATOR_DEFAULTS.visual.backdrop.blur
        }
        onReset={() =>
          updateBackdrop(
            "blur",
            CONFIGURATOR_DEFAULTS.visual.backdrop.blur,
          )
        }
      />
      <SliderField
        label="Gradient angle"
        value={backdrop.gradient.angle}
        min={0}
        max={360}
        step={5}
        onChange={(v) => updateGradient("angle", v)}
        isEdited={
          backdrop.gradient.angle !==
          CONFIGURATOR_DEFAULTS.visual.backdrop.gradient.angle
        }
        onReset={() =>
          updateGradient(
            "angle",
            CONFIGURATOR_DEFAULTS.visual.backdrop.gradient.angle,
          )
        }
      />
      <ColorField
        label="Gradient from"
        value={backdrop.gradient.from}
        onChange={(v) => updateGradient("from", v)}
        isEdited={
          backdrop.gradient.from !==
          CONFIGURATOR_DEFAULTS.visual.backdrop.gradient.from
        }
        onReset={() =>
          updateGradient(
            "from",
            CONFIGURATOR_DEFAULTS.visual.backdrop.gradient.from,
          )
        }
      />
      <ColorField
        label="Gradient to"
        value={backdrop.gradient.to}
        onChange={(v) => updateGradient("to", v)}
        isEdited={
          backdrop.gradient.to !==
          CONFIGURATOR_DEFAULTS.visual.backdrop.gradient.to
        }
        onReset={() =>
          updateGradient(
            "to",
            CONFIGURATOR_DEFAULTS.visual.backdrop.gradient.to,
          )
        }
      />
      <SliderField
        label="From pos %"
        value={backdrop.gradient.fromPos}
        min={0}
        max={100}
        step={1}
        onChange={(v) => updateGradient("fromPos", v)}
        isEdited={
          backdrop.gradient.fromPos !==
          CONFIGURATOR_DEFAULTS.visual.backdrop.gradient.fromPos
        }
        onReset={() =>
          updateGradient(
            "fromPos",
            CONFIGURATOR_DEFAULTS.visual.backdrop.gradient.fromPos,
          )
        }
      />
      <SliderField
        label="To pos %"
        value={backdrop.gradient.toPos}
        min={0}
        max={100}
        step={1}
        onChange={(v) => updateGradient("toPos", v)}
        isEdited={
          backdrop.gradient.toPos !==
          CONFIGURATOR_DEFAULTS.visual.backdrop.gradient.toPos
        }
        onReset={() =>
          updateGradient(
            "toPos",
            CONFIGURATOR_DEFAULTS.visual.backdrop.gradient.toPos,
          )
        }
      />
    </div>
  </div>

  );
}
