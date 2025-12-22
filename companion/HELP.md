## Blackmagic Controllers

It is possible to use a few of the Blackmagic Design USB/bluetooth controllers with Companion.

We currently support the following models:

- ATEM Micro Panel
- Resolve Replay Editor
- Resolve Speed Editor

This should work over both USB and Bluetooth, but we recommend using USB for the reliability.  
If you are having issues, please report it on Github. In particular there may be issues with bluetooth on Linux, depending on the system.

Danger: Do not run the ATEM software at the same time when using the ATEM Micro Panel — both programs will listen to presses and update colours.

The layout matches the device's natural grid when blank spaces are compacted. The T-bar occupies a column in this layout.

To use the T-bar, go to the surface settings and select a custom variable to receive the value. You can also provide an expression to control how the T-bar LEDs are lit.

LEDs on keys (on/off) respond to setting background color.
