# WebVR Polyfill

The goal of this project is two fold:

1. Make it possible for developers to use WebVR today, without special
   browser builds.
2. Provide good fallbacks for users that don't have VR hardware.


## Implementation

`CardboardHMDVRDevice` provides default parameters for Cardboard's
interpupillary distance and headset.

`GyroPositionSensorVRDevice` uses the DeviceMotionEvents (which map
roughly to the gyroscope) to polyfill head-tracking on mobile devices.
This is used both in Cardboard, and for Spotlight Stories-style
experiences.

`MouseKeyboardPositionSensorVRDevice` uses mouse events to allow you to
do the equivalent of mouselook. It also uses keyboard arrows and WASD
keys to look around the scene with the keyboard.

`WebSocketBridgeHMDPositionSensorVRDevice` [OcuBri](https://github.com/gtk2k/OcuBri)(WebSocketブリッジアプリ)を使って  
WebVR非対応のブラウザーでもOculus Riftを使用できるようにするデバイスオブジェクト。(Windowsのみ対応)  

## Open issues

- Provide a GUI to specify HMD parameters. Possibly a configuration UI
  for setting them for non-Cardboard devices.
- Provide new types of tracking, perhaps using the web camera for 3
  translational degrees of freedom, eg: <http://topheman.github.io/parallax/>


## 動作確認用サンプルページ
[こちら](https://github.com/gtk2k/gtk2k.github.io)に動作確認用サンプルページを用意しました。
