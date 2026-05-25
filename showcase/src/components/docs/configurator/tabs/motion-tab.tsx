import { useConfigurator } from "../context";
import { CONFIGURATOR_DEFAULTS } from "../helpers";
import { ColorField, NumberField, SliderField, TextField } from "../../ui/fields";

export function MotionConfiguratorTab() {
  const { motion, updateMotion } = useConfigurator();
  return (
  <div className="space-y-3">
    <div className="rounded-[8px] border border-foreground/10 bg-foreground/[0.025] p-4">
      <h3 className="docs-label mb-3 text-[0.66rem] font-normal uppercase text-foreground/42">
        Entry / exit
      </h3>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
        <SliderField
          label="Entry duration"
          value={motion.entryDuration}
          min={0}
          max={2}
          step={0.02}
          onChange={(v) => updateMotion("entryDuration", v)}
          isEdited={
            motion.entryDuration !==
            CONFIGURATOR_DEFAULTS.motion.entryDuration
          }
          onReset={() =>
            updateMotion(
              "entryDuration",
              CONFIGURATOR_DEFAULTS.motion.entryDuration,
            )
          }
        />
        <SliderField
          label="Entry delay"
          value={motion.entryDelay}
          min={0}
          max={1}
          step={0.02}
          onChange={(v) => updateMotion("entryDelay", v)}
          isEdited={
            motion.entryDelay !== CONFIGURATOR_DEFAULTS.motion.entryDelay
          }
          onReset={() =>
            updateMotion(
              "entryDelay",
              CONFIGURATOR_DEFAULTS.motion.entryDelay,
            )
          }
        />
        <SliderField
          label="Entry scale"
          value={motion.entryScale}
          min={0.7}
          max={1.1}
          step={0.01}
          onChange={(v) => updateMotion("entryScale", v)}
          isEdited={
            motion.entryScale !== CONFIGURATOR_DEFAULTS.motion.entryScale
          }
          onReset={() =>
            updateMotion(
              "entryScale",
              CONFIGURATOR_DEFAULTS.motion.entryScale,
            )
          }
        />
        <NumberField
          label="Entry Y (px)"
          value={motion.entryY}
          step={1}
          onChange={(v) => updateMotion("entryY", v)}
          isEdited={
            motion.entryY !== CONFIGURATOR_DEFAULTS.motion.entryY
          }
          onReset={() =>
            updateMotion("entryY", CONFIGURATOR_DEFAULTS.motion.entryY)
          }
        />
        <TextField
          label="Entry ease"
          value={motion.entryEase}
          onChange={(v) => updateMotion("entryEase", v)}
          isEdited={
            motion.entryEase !== CONFIGURATOR_DEFAULTS.motion.entryEase
          }
          onReset={() =>
            updateMotion(
              "entryEase",
              CONFIGURATOR_DEFAULTS.motion.entryEase,
            )
          }
        />
        <SliderField
          label="Exit duration"
          value={motion.exitDuration}
          min={0}
          max={1.5}
          step={0.02}
          onChange={(v) => updateMotion("exitDuration", v)}
          isEdited={
            motion.exitDuration !==
            CONFIGURATOR_DEFAULTS.motion.exitDuration
          }
          onReset={() =>
            updateMotion(
              "exitDuration",
              CONFIGURATOR_DEFAULTS.motion.exitDuration,
            )
          }
        />
        <SliderField
          label="Exit delay"
          value={motion.exitDelay}
          min={0}
          max={1}
          step={0.02}
          onChange={(v) => updateMotion("exitDelay", v)}
          isEdited={
            motion.exitDelay !== CONFIGURATOR_DEFAULTS.motion.exitDelay
          }
          onReset={() =>
            updateMotion(
              "exitDelay",
              CONFIGURATOR_DEFAULTS.motion.exitDelay,
            )
          }
        />
        <SliderField
          label="Exit scale"
          value={motion.exitScale}
          min={0.7}
          max={1.1}
          step={0.01}
          onChange={(v) => updateMotion("exitScale", v)}
          isEdited={
            motion.exitScale !== CONFIGURATOR_DEFAULTS.motion.exitScale
          }
          onReset={() =>
            updateMotion(
              "exitScale",
              CONFIGURATOR_DEFAULTS.motion.exitScale,
            )
          }
        />
        <NumberField
          label="Exit Y (px)"
          value={motion.exitY}
          step={1}
          onChange={(v) => updateMotion("exitY", v)}
          isEdited={motion.exitY !== CONFIGURATOR_DEFAULTS.motion.exitY}
          onReset={() =>
            updateMotion("exitY", CONFIGURATOR_DEFAULTS.motion.exitY)
          }
        />
        <TextField
          label="Exit ease"
          value={motion.exitEase}
          onChange={(v) => updateMotion("exitEase", v)}
          isEdited={
            motion.exitEase !== CONFIGURATOR_DEFAULTS.motion.exitEase
          }
          onReset={() =>
            updateMotion(
              "exitEase",
              CONFIGURATOR_DEFAULTS.motion.exitEase,
            )
          }
        />
      </div>
    </div>

    <div className="rounded-[8px] border border-foreground/10 bg-foreground/[0.025] p-4">
      <h3 className="docs-label mb-3 text-[0.66rem] font-normal uppercase text-foreground/42">
        Drag physics
      </h3>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
        <SliderField
          label="Up resistance"
          value={motion.upwardResistance}
          min={0}
          max={1}
          step={0.05}
          onChange={(v) =>
            updateMotion("upwardResistance", v)
          }
          isEdited={
            motion.upwardResistance !==
            CONFIGURATOR_DEFAULTS.motion.upwardResistance
          }
          onReset={() =>
            updateMotion(
              "upwardResistance",
              CONFIGURATOR_DEFAULTS.motion.upwardResistance,
            )
          }
        />
        <SliderField
          label="Down threshold"
          value={motion.downwardThreshold}
          min={0}
          max={1}
          step={0.05}
          onChange={(v) =>
            updateMotion("downwardThreshold", v)
          }
          isEdited={
            motion.downwardThreshold !==
            CONFIGURATOR_DEFAULTS.motion.downwardThreshold
          }
          onReset={() =>
            updateMotion(
              "downwardThreshold",
              CONFIGURATOR_DEFAULTS.motion.downwardThreshold,
            )
          }
        />
        <NumberField
          label="Velocity threshold"
          value={motion.velocityThreshold}
          step={50}
          onChange={(v) =>
            updateMotion("velocityThreshold", v)
          }
          isEdited={
            motion.velocityThreshold !==
            CONFIGURATOR_DEFAULTS.motion.velocityThreshold
          }
          onReset={() =>
            updateMotion(
              "velocityThreshold",
              CONFIGURATOR_DEFAULTS.motion.velocityThreshold,
            )
          }
        />
        <NumberField
          label="Snap stiffness"
          value={motion.snapStiffness}
          step={25}
          onChange={(v) => updateMotion("snapStiffness", v)}
          isEdited={
            motion.snapStiffness !==
            CONFIGURATOR_DEFAULTS.motion.snapStiffness
          }
          onReset={() =>
            updateMotion(
              "snapStiffness",
              CONFIGURATOR_DEFAULTS.motion.snapStiffness,
            )
          }
        />
        <NumberField
          label="Snap damping"
          value={motion.snapDamping}
          step={1}
          onChange={(v) => updateMotion("snapDamping", v)}
          isEdited={
            motion.snapDamping !==
            CONFIGURATOR_DEFAULTS.motion.snapDamping
          }
          onReset={() =>
            updateMotion(
              "snapDamping",
              CONFIGURATOR_DEFAULTS.motion.snapDamping,
            )
          }
        />
        <SliderField
          label="Snap mass"
          value={motion.snapMass}
          min={0.1}
          max={2}
          step={0.1}
          onChange={(v) => updateMotion("snapMass", v)}
          isEdited={
            motion.snapMass !== CONFIGURATOR_DEFAULTS.motion.snapMass
          }
          onReset={() =>
            updateMotion(
              "snapMass",
              CONFIGURATOR_DEFAULTS.motion.snapMass,
            )
          }
        />
      </div>
    </div>

    <div className="rounded-[8px] border border-foreground/10 bg-foreground/[0.025] p-4">
      <h3 className="docs-label mb-3 text-[0.66rem] font-normal uppercase text-foreground/42">
        Form layout
      </h3>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
        <NumberField
          label="Padding top (px)"
          value={motion.formPaddingTop}
          step={8}
          onChange={(v) =>
            updateMotion("formPaddingTop", v)
          }
          isEdited={
            motion.formPaddingTop !==
            CONFIGURATOR_DEFAULTS.motion.formPaddingTop
          }
          onReset={() =>
            updateMotion(
              "formPaddingTop",
              CONFIGURATOR_DEFAULTS.motion.formPaddingTop,
            )
          }
        />
        <NumberField
          label="Padding bottom (px)"
          value={motion.formPaddingBottom}
          step={8}
          onChange={(v) =>
            updateMotion("formPaddingBottom", v)
          }
          isEdited={
            motion.formPaddingBottom !==
            CONFIGURATOR_DEFAULTS.motion.formPaddingBottom
          }
          onReset={() =>
            updateMotion(
              "formPaddingBottom",
              CONFIGURATOR_DEFAULTS.motion.formPaddingBottom,
            )
          }
        />
        <TextField
          label="Justify"
          value={motion.formJustify}
          onChange={(v) => updateMotion("formJustify", v)}
          isEdited={
            motion.formJustify !==
            CONFIGURATOR_DEFAULTS.motion.formJustify
          }
          onReset={() =>
            updateMotion(
              "formJustify",
              CONFIGURATOR_DEFAULTS.motion.formJustify,
            )
          }
        />
        <TextField
          label="Align"
          value={motion.formAlign}
          onChange={(v) => updateMotion("formAlign", v)}
          isEdited={
            motion.formAlign !== CONFIGURATOR_DEFAULTS.motion.formAlign
          }
          onReset={() =>
            updateMotion(
              "formAlign",
              CONFIGURATOR_DEFAULTS.motion.formAlign,
            )
          }
        />
      </div>
    </div>

    <div className="rounded-[8px] border border-foreground/10 bg-foreground/[0.025] p-4">
      <h3 className="docs-label mb-3 text-[0.66rem] font-normal uppercase text-foreground/42">
        Animated backdrop
      </h3>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
        <SliderField
          label="Opacity"
          value={motion.backdropOpacity}
          min={0}
          max={1}
          step={0.05}
          onChange={(v) =>
            updateMotion("backdropOpacity", v)
          }
          isEdited={
            motion.backdropOpacity !==
            CONFIGURATOR_DEFAULTS.motion.backdropOpacity
          }
          onReset={() =>
            updateMotion(
              "backdropOpacity",
              CONFIGURATOR_DEFAULTS.motion.backdropOpacity,
            )
          }
        />
        <SliderField
          label="Blur (px)"
          value={motion.backdropBlur}
          min={0}
          max={24}
          step={1}
          onChange={(v) => updateMotion("backdropBlur", v)}
          isEdited={
            motion.backdropBlur !==
            CONFIGURATOR_DEFAULTS.motion.backdropBlur
          }
          onReset={() =>
            updateMotion(
              "backdropBlur",
              CONFIGURATOR_DEFAULTS.motion.backdropBlur,
            )
          }
        />
        <SliderField
          label="Angle"
          value={motion.backdropAngle}
          min={0}
          max={360}
          step={5}
          onChange={(v) => updateMotion("backdropAngle", v)}
          isEdited={
            motion.backdropAngle !==
            CONFIGURATOR_DEFAULTS.motion.backdropAngle
          }
          onReset={() =>
            updateMotion(
              "backdropAngle",
              CONFIGURATOR_DEFAULTS.motion.backdropAngle,
            )
          }
        />
        <ColorField
          label="Color"
          value={motion.backdropColor}
          onChange={(v) => updateMotion("backdropColor", v)}
          isEdited={
            motion.backdropColor !==
            CONFIGURATOR_DEFAULTS.motion.backdropColor
          }
          onReset={() =>
            updateMotion(
              "backdropColor",
              CONFIGURATOR_DEFAULTS.motion.backdropColor,
            )
          }
        />
        <ColorField
          label="Start color"
          value={motion.backdropStartColor}
          onChange={(v) =>
            updateMotion("backdropStartColor", v)
          }
          isEdited={
            motion.backdropStartColor !==
            CONFIGURATOR_DEFAULTS.motion.backdropStartColor
          }
          onReset={() =>
            updateMotion(
              "backdropStartColor",
              CONFIGURATOR_DEFAULTS.motion.backdropStartColor,
            )
          }
        />
        <ColorField
          label="End color"
          value={motion.backdropEndColor}
          onChange={(v) =>
            updateMotion("backdropEndColor", v)
          }
          isEdited={
            motion.backdropEndColor !==
            CONFIGURATOR_DEFAULTS.motion.backdropEndColor
          }
          onReset={() =>
            updateMotion(
              "backdropEndColor",
              CONFIGURATOR_DEFAULTS.motion.backdropEndColor,
            )
          }
        />
        <SliderField
          label="Start pos %"
          value={motion.backdropStartPos}
          min={0}
          max={100}
          step={1}
          onChange={(v) =>
            updateMotion("backdropStartPos", v)
          }
          isEdited={
            motion.backdropStartPos !==
            CONFIGURATOR_DEFAULTS.motion.backdropStartPos
          }
          onReset={() =>
            updateMotion(
              "backdropStartPos",
              CONFIGURATOR_DEFAULTS.motion.backdropStartPos,
            )
          }
        />
        <SliderField
          label="End pos %"
          value={motion.backdropEndPos}
          min={0}
          max={100}
          step={1}
          onChange={(v) =>
            updateMotion("backdropEndPos", v)
          }
          isEdited={
            motion.backdropEndPos !==
            CONFIGURATOR_DEFAULTS.motion.backdropEndPos
          }
          onReset={() =>
            updateMotion(
              "backdropEndPos",
              CONFIGURATOR_DEFAULTS.motion.backdropEndPos,
            )
          }
        />
      </div>
    </div>
  </div>

  );
}
