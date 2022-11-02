import React, { useState } from 'react';

import './App.css';
import ZoomMtgEmbedded from '@zoomus/websdk/embedded';
const KJUR = require('jsrsasign')

// <iframe hidden={hideVideo} src="https://player.twitch.tv/?channel=hydejackal&parent=localhost" frameborder="0" allowfullscreen="true" scrolling="no" height="378" width="620"></iframe>

function App() {
  const [hideVideo, setVideo] = useState(true);
  const [meetingUrl, setMeeting] = useState("");
  const [userName, setUserName] = useState("");
  const [isMainRoom, setRoom] = useState(true);

  const client = ZoomMtgEmbedded.createClient();

  // setup your signature endpoint here: https://github.com/zoom/meetingsdk-sample-signature-node.js
  var signatureEndpoint = 'http://localhost:4000'
  // This Sample App has been updated to use SDK App type credentials https://marketplace.zoom.us/docs/guides/build/sdk-app
  var sdkKey = 'gBV3uWEdYIcCid6cDgTNM29zw30rIWT5Mbde'
  var meetingNumber = ''
  var role = 0
  var userEmail = ''
  var passWord = ''
  // pass in the registrant's token if your meeting or webinar requires registration. More info here:
  // Meetings: https://marketplace.zoom.us/docs/sdk/native-sdks/web/component-view/meetings#join-registered
  // Webinars: https://marketplace.zoom.us/docs/sdk/native-sdks/web/component-view/webinars#join-registered
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
    /*
    fetch(signatureEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        meetingNumber: meetingNumber,
        role: role
      })
    }).then(res => res.json())
    .then(response => {
      startMeeting(response.signature)
      setVideo(false)
    }).catch(error => {
      console.error(error)
    })
    */
  }

  function changeRoom(){
    setRoom(!isMainRoom)
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
        /*
        toolbar: {
          buttons: [
            {
              text: 'Custom Button',
              className: 'CustomButton',
              onClick: () => {
                console.log('custom button');
              }
            }
          ]
        }
        */
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

  return (
    <div className="App">
      <main>
        <h1>Sentiment Analysis Zoom Meeting</h1>
        {/*
        <div class="row">
          <div id="meetingSDKElement" class="col-sm-6"></div>
          <div class="col-sm-6">
            <iframe hidden={hideVideo} width="560" height="315" src="https://www.youtube.com/embed/ypTjHQ-JtIk" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
          </div>
        </div>
        */}
        <div class="row">
          <div id="meetingSDKElement" class="col-sm-6" style={{marginLeft: "50px"}}></div>
          <div hidden={hideVideo} class="col-sm-4">
            <label style={{fontSize: "20px"}}>{isMainRoom ? "Main Room" : "Breakout Room"}</label>
            {isMainRoom ?
              <iframe style={{marginLeft: "20px"}} width="560" height="315" src="https://www.youtube.com/embed/ypTjHQ-JtIk"></iframe> 
              :
              <iframe style={{marginLeft: "20px"}} width="560" height="315" src="https://www.youtube.com/embed/vMBIz6UyPOc"></iframe>
            }
            <button style={{fontSize: "16px"}} onClick={changeRoom}>{isMainRoom ? "Switch to Breakout Room" : "Switch to Main Room"}</button>
          </div>
        </div>

        <form hidden={!hideVideo}>
          <label>Your Name:
            <input 
              type="text" 
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
            />
          </label>
          <div />
          <label>Meeting URL:
            <input 
              type="text" 
              value={meetingUrl}
              onChange={(e) => setMeeting(e.target.value)}
            />
          </label>
        </form>
        <button hidden={!hideVideo} onClick={getSignature}>Join Meeting</button>
      </main>
    </div>
  );
}

export default App;
