import React from "react";
import {
  FormGroup,
  InputGroup,
  Checkbox,
  Tag,
  NumericInput,
  MenuItem,
} from "@blueprintjs/core";
import { ItemRenderer, Select2 } from "@blueprintjs/select";

export const enum CorrectionFactor {
  Achromatic = "achromatic",
  Fluorite = "fluorite",
  Apochromatic = "apochromatic",
}

const CorrectionFactors = [
  CorrectionFactor.Achromatic,
  CorrectionFactor.Fluorite,
  CorrectionFactor.Apochromatic,
];
const Magnifications = [
  0.5, 1, 1.5, 2, 2.5, 3.2, 3.3, 4, 5, 6.3, 10, 16, 20, 25, 40, 43, 45, 50, 60,
  80, 97, 100, 120, 200,
];

export const enum FocalLengthType {
  Infinite = "infinite",
  Fixed = "fixed",
}

export const enum ObjectiveType {}

export type InfiniteFocalLength = {
  type: FocalLengthType.Infinite;
};

export type FixedFocalLength = {
  type: FocalLengthType.Fixed;
  length: number;
};

export type ObjectiveProps = {
  name: string;
  brand: string;
  length: number; // mm
  workingDistance: number; // mm
  parfocalLength: number; // mm length+wd
  magnification: number;
  numericalAperture: number;
  focalLength: InfiniteFocalLength | FixedFocalLength;
  immersion: boolean; // immersion lens OIL, OEL, HI
  phase: boolean; // phase contrast lens
  pol: boolean; // polarizing lens
  plan: boolean; // planar lens
  correctionFactor: CorrectionFactor;
};

const renderCorrectionFactor: ItemRenderer<CorrectionFactor> = (
  type,
  { handleClick, handleFocus, modifiers }
) => {
  return (
    <MenuItem
      active={modifiers.active}
      disabled={modifiers.disabled}
      key={type}
      onClick={handleClick}
      onFocus={handleFocus}
      roleStructure="listoption"
      text={type}
    />
  );
};

/**
 * Represents a single objective lens.
 */
export const Objective = () => {
  const [magnification, setMagnification] = React.useState<number>();
  const [workingDistance, setWD] = React.useState<number>();
  const [correctionFactor, setCF] = React.useState<CorrectionFactor>(
    CorrectionFactor.Achromatic
  );
  const [parfocalDistance, setParfocal] = React.useState<number>();
  const [name, setName] = React.useState<string>();
  const [na, setNA] = React.useState<number>();
  const [plan, setPlan] = React.useState<boolean>(false);
  const [immersion, setImmersion] = React.useState<boolean>(false);

  const handlePlan: React.FormEventHandler<HTMLInputElement> = () =>
    setPlan(!plan);
  const handleImmersion: React.FormEventHandler<HTMLInputElement> = () =>
    setImmersion(!immersion);
  const handleName: React.FormEventHandler<HTMLInputElement> = (e) =>
    setName(e.currentTarget.value);

  return (
    <FormGroup label={name || "new lens"} labelInfo="(objective)">
      <InputGroup
        type="text"
        defaultValue={name}
        placeholder="..."
        onChange={handleName}
        value={name}
        fill={true}
        leftElement={<Tag>name</Tag>}
      />
      <NumericInput
        min={1}
        max={200}
        stepSize={5}
        minorStepSize={1}
        placeholder="magnification"
        clampValueOnBlur={true}
        allowNumericCharactersOnly={false}
        onValueChange={setMagnification}
        value={magnification}
        leftElement={<Tag>mag</Tag>}
        rightElement={<Tag>{magnification || 1}X</Tag>}
        fill={true}
      />
      <NumericInput
        min={1}
        max={200}
        stepSize={5}
        minorStepSize={1}
        placeholder="working distance"
        clampValueOnBlur={true}
        allowNumericCharactersOnly={false}
        onValueChange={setWD}
        value={workingDistance}
        leftElement={<Tag>wd</Tag>}
        rightElement={<Tag>{workingDistance || "?"}mm</Tag>}
        fill={true}
      />
      <NumericInput
        min={1}
        max={200}
        stepSize={5}
        minorStepSize={1}
        placeholder="parfocal distance"
        clampValueOnBlur={true}
        allowNumericCharactersOnly={false}
        onValueChange={setParfocal}
        value={parfocalDistance}
        leftElement={<Tag>pd</Tag>}
        rightElement={<Tag>{parfocalDistance || "?"}mm</Tag>}
        fill={true}
      />
      <NumericInput
        min={0}
        max={2}
        stepSize={0.1}
        minorStepSize={0.01}
        placeholder="numerical aperture"
        clampValueOnBlur={true}
        allowNumericCharactersOnly={false}
        onValueChange={setNA}
        value={na}
        leftElement={<Tag>na</Tag>}
        rightElement={<Tag>{na || "?"}</Tag>}
        fill={true}
      />
      <Select2<CorrectionFactor>
        items={[
          CorrectionFactor.Achromatic,
          CorrectionFactor.Fluorite,
          CorrectionFactor.Apochromatic,
        ]}
        itemRenderer={renderCorrectionFactor}
        onItemSelect={setCF}
        filterable={false}
        popoverProps={{ minimal: true }}
      >
        <InputGroup
          leftElement={<Tag>correction</Tag>}
          value={correctionFactor}
        />
      </Select2>
      <Checkbox inline={true} checked={plan} onChange={handlePlan}>
        <Tag>plan</Tag>
      </Checkbox>
      <Checkbox inline={true} checked={immersion} onChange={handleImmersion}>
        <Tag>immersion</Tag>
      </Checkbox>
    </FormGroup>
  );
};
