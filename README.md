## noskop

This project interfaces a microscope with a CNC control system, and lets you drive it with a Playstation
controller.

### Why?

Looking at micro-critters with a microscope is plenty of fun, but microscope controls are fiddly
and un-ergonomic. To avoid interacting with the scope, I rigged it up for remote viewing and control.

### How?

This project leverages a common 3D printer motherboard, which drives stepper motors linked to the scope's
stage controls. The software manages its own command queue and state independently from the printer
motherboard, and adapts user input feel and responsiveness to the scope state.

In this manner, the project achieves several goals:

- rich, intuitive, and _fun_ user interaction
- a framework for automated interaction/intervention/investigation
- semi-reliable positioning in increments of **~0.1 μm**

### Getting Started

This software is offered in an **early preview** state. It might work with any 3D printer or CNC device
that will accept gcode over serial, but it was developed for my setup. The results will prove dangerous
in many cases. **To trust your own device to this tool would be madness.**

**Requirements:**

- Node.js v18
- yarn package manager
- Dualsense controller
- CNC microscope

```
# git clone git@github.com:nsfm/noskop.git
# cd noskop
# yarn install
# yarn start
```

This will attempt to connect to a USB serial device on `/dev/ttyACM0` and a Playstation 5
Dualsense controller. If it succeeds, the scope should immediately begin responding to the
controller. Customize `src/main.ts` as needed.

### Controls

- **Left Analog** - Moves the stage on the X and Y axis
- **Left / Right Bumpers** - Moves the stage on the Z axis (focus control)
- **Left Trigger** - Linear boost for movement speed
- **Right Trigger** - Linear brake for movement speed
- **D-Pad Left/Right** - Rotate objective turret (magnification change)
- **D-Pad Up/Down** - Moves the sub-stage / condenser on the Z axis
- **Right Analog** - Sets light source properties
- **Circle** - Hold to double movement speed
- **Square** - Hold to halve movement speed
- **Cross** - Get endstop and position states
- **Triangle** - Run input smoothing calibration routine
- **Mute** - Press to toggle steppers on/off (if the indicator light is on, steppers are off)
- **PS Button** - Shut down the scope and exit

### Feature Roadmap

#### Endstops / Homing / Stallguard

- X/Y working but not integrated
- Z requires a firmware update for the BLTouch
- Homing probably working but I'm afraid to send this command
- Trying to enable stepper-driver level stallguard support to detect bad behavior

#### Micromanipulation

- X/Y/Z for right-hand manipulation (Eppendorf 6540 R094 x3, steppers with encoders)
- X/Y for left-hand manipulation (Newport 850F x2, DC gearmotors with encoders)
- Planning to experiment with simultaneous multi-touch control

#### Lightsource

- Color, intensity, shape
  - Neopixel grid plus high CRI white LEDs
  - Printer motherboard has a neopixel controller built-in
- Sub-stage control
  - Can adjust condenser Z using a flexible drive shaft
  - Not sure how to adjust diaphragm yet.

#### Stage rotation

- Rotation is oriented on the slide center, not the optical center
- Current approach requires time-consuming re-positioning of the stage/objective
  - Retract the stage
  - Switch to low-power (short) objective
  - Home X/Y
  - Center slide on X/Y
  - Raise stage slightly above the usual max Z until it contacts the actuator
  - Rotate stage to desired angle
  - Return to original objective and stage position

### Tested Hardware

via auction:

- Eutectic Electronics Motorized XY Stage (1980's)
  - ~100mm by ~100mm workspace
  - 2x new NEMA 17 stepper (0.9 degree step angle)
  - 4x original mechanical limit switch
  - Both axes use fine leadscrews with standard-looking linear rails
  - Rotating specimen plate
- Microscopes
  - _originally_, Zeiss Invertoskop ID-02 (2002, New England Medical Center #11559)
  - _rip_, Olympus BH-B (1974 - 2022, unknown origin)
  - _currently_, Olympus BH-A (1974, University of Cincinnati #0195845)

via retailer:

- BigTreeTech Octopus Pro v1.0 3D printer motherboard (2021)
  - 8 stepper outputs (7 + Z mirror)
- Dualsense Controller (2022)
  - Wired/wireless HID device
- Z / Focus control
  - NEMA 17 stepper (1.8 degree step angle)
  - Synchronous belt, sprocket bolted to fine focus adjust knob (10:1 reduction)
  - Plenty of aluminum extrusion for positioning
  - BLTouch for homing
- E / Turret control
  - NEMA 17 stepper (1.8 degree step angle)
  - Friction drive using a rubber RC wheel
  - Adjustable locking camera arm provides positioning
  - No homing capability yet, relies on visual feedback
