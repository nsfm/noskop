## noskop

This was the original implementation before switching to a browser-first approach. It will be consolidated into the other project.

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
