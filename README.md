## noskop

This project allows the operator to command a computerized microscope using a Playstation controller.

### Why?

> The want of some concise, yet sufficiently comprehensive, _popular_ account of the Microscope, both as regards the management and manipulation of the instrument, and the varied wonders and hidden realms of beauty that are disclosed and developed by its aid. **Jabez Hogg**, _The Microscope: Its History, Construction, and Application_, 1854

> And the belief that many who possess microscopes are deterred from attempting any branch of original investigation solely by the great difficulty they experience surmounting elementary detail and mere mechanical operations. **Lionel Smith Beale**, _How To Work With The Microscope_, 1857

### How?

A 3D printer motherboard drives stepper motors coupled to the scope's stage controls.

This application provides interactive control and a framework for building CNC routines.

### Project Goals

- Reliable micron-scale positioning
- Lowest cost possible
- Suitable for extended operation
- Free, open-source software
- Fun to use

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
Dualsense controller (USB or Bluetooth). If it succeeds, the scope will immediately begin
responding to controller inputs. Customize `src/main.ts` as needed.

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

### Feature status

Check out the [roadmap](ROADMAP.md) for more details.
