import io from 'socket.io-client'
import React, {Component} from 'react';
import {View, Text, Button, StyleSheet} from 'react-native';

import {RTCPeerConnection, RTCView, mediaDevices, RTCIceCandidate, RTCSessionDescription} from 'react-native-webrtc';

class App extends Component {
  constructor(props){
    super(props)
    this.socket = io('http://192.168.0.100:5000/')
    this.state = {
      isMuted: false,
      localStream: '',
      remoteStream: '',
      cachedLocalPC: '',
      cachedRemotePC: '',
    }
  }

  componentDidMount = async () => {
    this.socket.on('offerOrAnswer', async (sdp) => {
      await this.pc.setRemoteDescription(new RTCSessionDescription(sdp))
      await console.log(this.state.remoteStream, "Remote Streammmmmmmmmm")
    })

    this.socket.on('candidate', async (candidate) => {
      await this.pc.addIceCandidate(new RTCIceCandidate(candidate))
    })

    const isFront = true;
    const devices = await mediaDevices.enumerateDevices();

    const facing = isFront ? 'front' : 'environment';
    const videoSourceId = devices.find(device => device.kind === 'videoinput' && device.facing === facing);
    const facingMode = isFront ? 'user' : 'environment';
    const constraints = {
      audio: true,
      video: {
        mandatory: {
          minWidth: 500,
          minHeight: 300,
          minFrameRate: 30,
        },
        facingMode,
        optional: videoSourceId ? [{sourceId: videoSourceId}] : [],
      },
    };
    const newStream = await mediaDevices.getUserMedia(constraints);
    this.setState({
      localStream: newStream
    })




    const configuration = {iceServers: [{url: 'stun:stun.l.google.com:19302'}]};
    this.pc = new RTCPeerConnection(configuration);
    this.pc.onaddstream = (e) => {
      this.setState({remoteStream: e.stream})
    }

    this.pc.addStream(newStream)
  }

  startCall = async () => {

    this.pc.onicecandidate = (e) => {
      if (e.candidate) {
        this.sendToPeer('candidate', e.candidate)
      }
    }

    this.pc.createOffer({ offerToReceiveVideo: 1 })
        .then(sdp => {
          this.pc.setLocalDescription(sdp)
          this.sendToPeer('offerOrAnswer', sdp)
        })
  };

  sendToPeer = (messageType, payload) => {
    this.socket.emit(messageType, {
      socketID: this.socket.id,
      payload
    })
  };

  createAnswer = () => {
    this.pc.createAnswer({ offerToReceiveVideo: 1 })
        .then(sdp => {
          this.pc.setLocalDescription(sdp)
          this.sendToPeer('offerOrAnswer', sdp)
        })
  }

  render(){
    const {localStream, remoteStream} = this.state
    return (
        <View style={styles.container}>
          <Button title="Start call" onPress={this.startCall} disabled={!localStream} />
          <Button title="Answer Call" onPress={this.createAnswer} disabled={!remoteStream}/>


          <View style={styles.rtcview}>
            <Text>{localStream && <RTCView style={{width: 300, height: 300}} streamURL={localStream.toURL()} />}</Text>
          </View>
          <View style={styles.rtcview}>
            <Text>{remoteStream &&<RTCView style={{width: 300, height: 300}} streamURL={remoteStream.toURL()} />}</Text>
          </View>
        </View>
    );
  };
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#313131',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: '100%',
  },
  text: {
    fontSize: 30,
  },
  rtcview: {
    justifyContent: 'center',
    alignItems: 'center',
    height: '40%',
    width: '80%',
    backgroundColor: 'black',
  },
  toggleButtons: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
});

export default App
