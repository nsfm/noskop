## noskop

This project helps you operate a computerized microscope using a controller, natively from your browser.

It relies on the WebHID API for Dualsense controller support (USB or bluetooth), and the Web Serial API to communicate with a Marlin-style CNC device.

_It's not complete, but you can [check it out at noskop.com](https://noskop.com)_

### Current status:

- There's a separate Node.js CLI tool under [cli/](./cli/) providing basic movement controls with Dualsense integration
- The browser version isn't integrated with the microscope, but there's a basic UI with Dualsense and webcam integration
- Very few features are functional

### Why?

> The want of some concise, yet sufficiently comprehensive, popular account of the Microscope, both as regards the management and manipulation of the instrument, and the varied wonders and hidden realms of beauty that are disclosed and developed by its aid.
>
> **Jabez Hogg**, _The Microscope: Its History, Construction, and Application_, 1854

> And the belief that many who possess microscopes are deterred from attempting any branch of original investigation solely by the great difficulty they experience surmounting elementary detail and mere mechanical operations.
>
> **Lionel Smith Beale**, _How To Work With The Microscope_, 1857

In other words, maybe folks would enjoy microscopes more if they were fun and easy to use. Ideally, it would feel like there was _no scope_ at all.
