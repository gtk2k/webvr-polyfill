/*
 * Copyright 2015 Kenji Tanaka. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
var HMDPositionSensorVRDevice = require('./base.js').HMDPositionSensorVRDevice;

/**
 * The base class for all VR position sensor devices.
 */
function PositionSensorVRDevice() {
}
PositionSensorVRDevice.prototype = new HMDPositionSensorVRDevice();

function WebSocketBridgeHMDPositionSensorVRDevice() {
  this.deviceId = 'websocket-bridge:hmdpositionsonsor';
  this.deviceName = 'WebSocket Bridge HMD And Position Sensor';
  var that = this;
  this.urlArgs = {};
  location.search.substr(1).split('&').forEach(function (elm) {
    var kvp = elm.split('=');
    that.urlArgs[kvp[0]] = kvp[1];
  });
  

  this.ws = null;

  this.profile = {
    hmdType: 'DK2',
    playerHeight: 1.778,
    eyeHeight: 1.675,
    ipd: 0.064,
    neckToEyeDistance: [.0, .0],
    eyeReliefDial: 3,
    eyeToNoseDistance: [.0, .0],
    maxEyeToPlateDistanse: [.0, .0],
    eyeCup: '',
    customEyeRender: false,
    cameraPosition: [.0, .0, .0, 1.0, .0, .0, .0]
  };

  this.orientation = {
    left: { x: 0, y: 0, z: 0, w: 0 },
    right: { x: 0, y: 0, z: 0, w: 0 }
  };

  this.position = {
    left: { x: 0, y: 0, z: 0 },
    right: { x: 0, y: 0, z: 0 }
  };

  // Default DK2
  this.eyeTranslation = {
    left: { x: -0.03200000151991844, y: -0, z: -0, w: 0 },
    right: { x: 0.03200000151991844, y: -0, z: -0, w: 0 }
  };

  // Default DK2
  this.recommendedFieldOfView = {
    left: {
      upDegrees: 64.93594360351562,
      downDegrees: 64.93594360351562,
      leftDegrees: 64.71646881103516,
      rightDegrees: 44.149356842041016
    },
    right: {
      upDegrees: 64.93594360351562,
      downDegrees: 64.93594360351562,
      leftDegrees: 44.149356842041016,
      rightDegrees: 64.71646881103516
    }
  };
}
WebSocketBridgeHMDPositionSensorVRDevice.prototype = new HMDPositionSensorVRDevice();

WebSocketBridgeHMDPositionSensorVRDevice.prototype.wsStart = function () {
  var that = this;
  this.tryCount = 0;

  function wsOnClose() {
    that.ws = null;
    that.tryCount++;
    if (that.tryCount == 3) {
      that.tryCount = 0;
      that.NotifyMessage('OcuBriが起動していないようです。');
    } else {
      wsInit();
    }
  }
  function wsInit() {
    if (that.urlArgs.pg == 'oculus') {
      that.ws = new WebSocket('ws://localhost:4649/oculus');
      that.ws.onmessage = oculusOnMessage;
    } else {
      if (that.tryCount == 0) {
        if (urlArgs.pg == 'pause') {
          that.NotifyMessage('Oculusウィンドウを閉じてます。');
        } else {
          that.NotifyMessage('Oculusウィンドウを準備中。');
        }
      }
      that.ws = new WebSocket('ws://localhost:4649/main');
      that.ws.onopen = wsOnOpen;
      that.ws.onmessage = mainOnMessage;
    }
    that.ws.binaryType = 'arraybuffer';
    that.ws.onclose = wsOnClose;
  }
  function wsOnOpen() {
    var sendData = {};
    if(!that.urlArgs.pg){
      sendData.cmd = 'oculusWindowOpen';
      sendData.browser = browser;
      sendData.url = location.href + '?pg=oculus';
      that.ws.send(JSON.stringify(sendData));
    } else {
      sendData.cmd = 'oculusWindowClose';
      that.ws.send(JSON.stringify(sendData));
    }
  }

  function mainOnMessage(e) {
    if (e.data.length == 0) return;
    var msg = JSON.parse(e.data);
    switch (msg.cmd) {
      case 'no connect':
        // ★alertを表示するとビデオテクスチャーが止まってしまう。
        //alert('Oculus Riftが接続されていません。');
        that.NotifyMessage('Oculus Riftが接続されていません。');

        that.ws.onclose = null;
        that.ws.close();
        break;
      case 'opened':
        location.href = location.origin + location.pathname + location.search + (location.search ? + '&' : '?') + 'pg=pause';
        break;
      case 'open error':
        that.NotifyMessage('Oculusウィンドウを表示するときにエラーが発生しました。<br>(' + msg.msg + ')');
        break;
      case 'closed':
        var sch = [];
        for (var i in urlArgs) {
          if (i != 'pg') {
            sch.push(spl + i + '=' + urlArgs[i]);
          }
        }
        location.href = location.origin + location.pathname + (sch.length ? sch.join('&') : '');
        break;
      case 'close error':
        that.NotifyMessage('Oculusウィンドウを閉じるときにエラーが発生しました。もしOculusウィンドウが開いたままの場合は、手動で閉じてください。<br>(' + msg.msg + ')');
        location.href = location.origin + location.pathname + (sch.length ? sch.join('&') : '');
        break;
    }
  }

  function oculusOnMessage(e) {
    if (e.data.byteLength == 0) return;
    var msg = new WebSocketMessageParser(e.data);
    if (msg.cmd) {
      switch (msg.cmd) {
        case 'p':
          that.profile = msg;
          switch (msg.hmdType) {
            case 'DK1':
              that.recommendedFieldOfView = {
                left: {
                  upDegrees: 64.93594360351562,
                  downDegrees: 64.93594360351562,
                  leftDegrees: 64.71646881103516,
                  rightDegrees: 44.149356842041016
                },
                right: {
                  upDegrees: 64.93594360351562,
                  downDegrees: 64.93594360351562,
                  leftDegrees: 44.149356842041016,
                  rightDegrees: 64.71646881103516
                }
              };
              break;
            default:
              // DK2の値を使用
              that.recommendedFieldOfView = {
                left: {
                  upDegrees: 64.93594360351562,
                  downDegrees: 64.93594360351562,
                  leftDegrees: 64.71646881103516,
                  rightDegrees: 44.149356842041016
                },
                right: {
                  upDegrees: 64.93594360351562,
                  downDegrees: 64.93594360351562,
                  leftDegrees: 44.149356842041016,
                  rightDegrees: 64.71646881103516
                }
              };
              break;
          }

          // DefaultEyeFovを使用する場合はコメントアウトを外す
          //this.recommendedFieldOfView = this.profile.fov;
          break;
        case 'o':
          alert('他のページで接続中のため接続できません。');
          break;
      }
    } else {
      that.orientation = {
        left: new THREE.Quaternion(msg[0], msg[1], msg[2], msg[3]),
        right: new THREE.Quaternion(msg[4], msg[5], msg[6], msg[7])
      };
      that.position = {
        left: new THREE.Vector3(msg[8], msg[9], msg[10]),
        right: new THREE.Vector3(msg[11], msg[12], msg[13], msg[14])
      };
    }
  }

  wsInit();
};

WebSocketBridgeHMDPositionSensorVRDevice.prototype.NotifyMessage = function (msg) {
  msgDlg.textContent = msg;
  msgDlg.className = 'animatestop';
  setTimeout(function () {
    msgDlg.className = 'animate';
  }, 0);
}

WebSocketBridgeHMDPositionSensorVRDevice.prototype.wsStop = function () {
  if (this.ws != null) {
    this.ws.onclose = null;
    this.ws.close();
  }
};

WebSocketBridgeHMDPositionSensorVRDevice.prototype.getEyeParameters = function (whichEye) {
  if (this.eyeTranslation[whichEye]) {
    return {
      eyeTranslation: this.eyeTranslation[whichEye],
      recommendedFieldOfView: this.recommendedFieldOfView[whichEye]
    };
  } else {
    console.error('Invalid eye provided: %s', whichEye);
    return null;
  }
};

WebSocketBridgeHMDPositionSensorVRDevice.prototype.getState = function () {
  return {
    orientation: this.orientation['left'],
    position: this.position['left']
  };
};

WebSocketBridgeHMDPositionSensorVRDevice.prototype.resetSensor = function () {
  ws.send("recenter");
};


module.exports = WebSocketBridgeHMDPositionSensorVRDevice;