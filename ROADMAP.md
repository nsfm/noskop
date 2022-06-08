### Feature Status

#### Endstops / Homing / Stallguard

- X/Y working but not integrated
- Z requires a firmware update for the BLTouch
- Homing probably working but I'm afraid to send this command
- Trying to enable stepper-driver level stallguard support to detect bad behavior

#### Micromanipulation

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
