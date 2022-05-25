## noskop

This project allows for the operation of a CNC microscope using a Playstation controller.

### What?

Looking at micro critters with a microscope is plenty of fun, but stage controls are fiddly
and not so ergonomic. The solution was clear: rig the scope up for remote viewing and control.

### How?

Each axis is driven by a stepper motor. The steppers are controlled by a regular 3d printer
motherboard. Inputs from the controller are translated into gcode and sent to the board
via USB serial.

### Getting Started

This might work with any printer or CNC device that accepts commands over serial, but it
was developed for my setup. The results will prove dangerous in many cases. **To trust your
own device to this tool would be madness.**

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
- **Circle** - Hold to enable boost
- **Square** - Hold to enable poost (anti-boost / precision-boost)
- **Left Trigger** - During (b/p)oost, controls travel rate on X and Y axes
- **Mute** - Press to toggle steppers on/off
- **Triangle** - Get endstop and position states
- **Cross** - Attack
- **PS Button** - Shut down the scope and exit
- **Left Bumper** - Raise stage
- **Right Bumper** - Lower stage

### Tested Hardware

via eBay:

- Eutectic Electronics Motorized XY Stage (1980's)
  - 100mm x 100mm travel area
  - 2x NEMA 17 stepper (0.9 degree step angle)
  - 4x mechanical limit switch
  - Both axes use fine leadscrews with linear rails
  - Rotating specimen plate
- Microscopes
  - _originally_, Zeiss Invertoskop ID-02 (2002, New England Medical Center #11559)
  - _rip_, Olympus BH-B (1974 - 2022, unknown)
  - _currently_, Olympus BH-A (1974, University of Cincinnati #0195845)

via Amazon:

- Z / Focus control
  - NEMA 17 stepper (1.8 degree step angle)
  - Synchronous belt
  - Sprocket bolted to fine focus adjust knob (10:1 reduction)
  - Plenty of aluminum extrusion
  - BLTouch for homing
- BigTreeTech Octopus Pro v1.0 3D printer motherboard (2021)
  - 8 stepper outputs (7 + Z mirror)
- Dualsense Controller (2022)
  - Wired/wireless HID device
