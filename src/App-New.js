import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';

import './App.css';
import ZoomMtgEmbedded from '@zoomus/websdk/embedded';
const KJUR = require('jsrsasign')

const socket = io();

// <iframe hidden={hideVideo} src="https://player.twitch.tv/?channel=hydejackal&parent=localhost" frameborder="0" allowfullscreen="true" scrolling="no" height="378" width="620"></iframe>

function App() {
  const [userType, setUserType] = useState('');
  const [hideVideo, setVideo] = useState(true);
  const [meetingUrl, setMeeting] = useState("");
  const [userName, setUserName] = useState("");
  const [isMainRoom, setRoom] = useState(true);
  const [isMainView, setMainView] = useState(false);
  const [userInMain, setUserInMain] = useState(true);

  useEffect(() => {
    socket.on('connect', () => {
      console.log("connected")
    });

    socket.on('disconnect', () => {
      console.log("disconnected")
    });

    socket.on('changeToMain', (value) => {
      console.log("organizer changed user to main room ", value)
      setRoom(value)
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('changeUserToMain');
    };
  }, []);

  const client = ZoomMtgEmbedded.createClient();

  var sdkKey = 'gBV3uWEdYIcCid6cDgTNM29zw30rIWT5Mbde'
  var meetingNumber = ''
  var role = 0
  var userEmail = ''
  var passWord = ''
  var registrantToken = ''

  function genSignature(meetingNumber, role){
    const iat = Math.round(new Date().getTime() / 1000) - 30;
    const exp = iat + 60 * 60 * 2
    console.log(process.env.REACT_APP_ZOOM_SDK_KEY)
    const oHeader = { alg: 'HS256', typ: 'JWT' }

    const oPayload = {
      sdkKey: process.env.REACT_APP_ZOOM_SDK_KEY,
      mn: meetingNumber,
      role: role,
      iat: iat,
      exp: exp,
      appKey: process.env.REACT_APP_ZOOM_SDK_KEY,
      tokenExp: iat + 60 * 60 * 2
    }
    console.log(process.env.REACT_APP_ZOOM_SDK_KEY)
    const sHeader = JSON.stringify(oHeader)
    const sPayload = JSON.stringify(oPayload)
    const signature = KJUR.jws.JWS.sign('HS256', sHeader, sPayload, process.env.REACT_APP_ZOOM_SDK_SECRET)
    return signature
  }

  function getSignature(e) {
    e.preventDefault();
    try{
      meetingNumber = meetingUrl.split("/j/")[1].split("?")[0].trim()
      passWord = meetingUrl.split("pwd=")[1].trim()
    }
    catch(e){
      alert("Invalid Meeting URL")
      return
    }
    if(!userName){
      alert("Empty User Name")
      return
    }
    if(!meetingNumber || !passWord){
      alert("Invalid Meeting URL")
      return
    }
    var sig = genSignature(meetingNumber, role)
    startMeeting(sig)
    setVideo(false)
  }

  function startMeeting(signature) {

    let meetingSDKElement = document.getElementById('meetingSDKElement');
    client.init({
      debug: true,
      zoomAppRoot: meetingSDKElement,
      language: 'en-US',
      customize: {
        meetingInfo: ['topic', 'host', 'mn', 'pwd', 'telPwd', 'invite', 'participant', 'dc', 'enctype'],
        video: {
          isResizable: true,
          viewSizes: {
            default: {
              width: 750,
              height: 500
            },
            ribbon: {
              width: 300,
              height: 700
            }
          }
        }
      }
    });

    client.join({
    	sdkKey: sdkKey,
    	signature: signature,
    	meetingNumber: meetingNumber,
    	password: passWord,
    	userName: userName,
      userEmail: userEmail,
      tk: registrantToken
    })
  }

  function setUser(e){
    setUserType(e.currentTarget.value)
  };

  function showMainView(){
    setMainView(true);
  }

  function changeUserToMain(){
    setUserInMain(true)
    socket.emit('setUserToMain', true);
  }

  function changeUserToBreakout(){
    setUserInMain(false)
    socket.emit('setUserToMain', false);
  }

  return (
    <div className="App">
      <main>
        <h1>Sentiment Analysis Zoom Meeting</h1>
        <div hidden={isMainView}>
          <label>You are a: </label>
          <input
            type='radio'
            id='radio1'
            value='organizer'
            onChange={setUser}
            checked={userType === "organizer"}
            style={{marginLeft: "10px"}}
          />
          <label style={{marginLeft: "5px"}}>Organizer</label>
          <input
            type='radio'
            id='radio2'
            value='user'
            onChange={setUser}
            checked={userType === "user"}
            style={{marginLeft: "20px"}}
          />
          <label style={{marginLeft: "5px"}}>User</label>
          <button hidden={!userType} style={{marginLeft: "10px", "padding": "10px", "marginTop": "0px"}} onClick={ showMainView }>Confirm</button>
        </div>
        <div hidden={!isMainView}>
          <div class="row">
            <div id="meetingSDKElement" class="col-sm-6" style={{marginLeft: "50px"}}></div>
            <div hidden={hideVideo} class="col-sm-4">
              <label style={{fontSize: "20px"}}>{isMainRoom ? "Main Room" : "Breakout Room"}</label>
              {isMainRoom ?
                <iframe style={{marginLeft: "20px"}} width="560" height="315" src="https://www.youtube.com/embed/ypTjHQ-JtIk"></iframe> 
                :
                <iframe style={{marginLeft: "20px"}} width="560" height="315" src="https://www.youtube.com/embed/vMBIz6UyPOc"></iframe>
              }
            </div>
          </div>

          <form hidden={!hideVideo}>
            <label hidden={userType==="organizer"}>Your Name:
              <input 
                type="text" 
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
              />
            </label>
            <div />
            <label hidden={userType==="organizer"}>Meeting URL:
              <input 
                type="text" 
                value={meetingUrl}
                onChange={(e) => setMeeting(e.target.value)}
              />
            </label>
          </form>
          <button hidden={!hideVideo || userType==="organizer"} onClick={getSignature}>Join Meeting</button>
          <div hidden={userType!=="organizer"}>
            <p style={{fontSize: "16px"}}>Users are viewing: { userInMain ? "Main Room" : "Breakout Room" }</p>
            <button style={{fontSize: "16px"}} onClick={changeUserToMain}>Switch User View to Main Room</button>
            <button style={{fontSize: "16px", marginLeft: "20px"}} onClick={changeUserToBreakout}>Switch User View to Breakout Room</button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
