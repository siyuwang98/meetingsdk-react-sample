import React, { useState } from 'react';

import './App.css';
import ZoomMtgEmbedded from '@zoomus/websdk/embedded';

function App() {
  const [hideVideo, setVideo] = useState(true);
  const [meetingUrl, setMeeting] = useState("");
  const [userName, setUserName] = useState("");

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
  }

  function startMeeting(signature) {

    let meetingSDKElement = document.getElementById('meetingSDKElement');

    client.init({
      debug: true,
      zoomAppRoot: meetingSDKElement,
      language: 'en-US',
      customize: {
        meetingInfo: ['topic', 'host', 'mn', 'pwd', 'telPwd', 'invite', 'participant', 'dc', 'enctype'],
        customize: {
          breakout_room: {
            enable: true
          }
        },
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
        <h1>Zoom Meeting SDK Sample React</h1>
        <div class="row">
          <div id="meetingSDKElement" class="col-sm-4"></div>
          <div class="col-sm-4">
            <iframe hidden={hideVideo} width="560" height="315" src="https://www.youtube.com/embed/ypTjHQ-JtIk" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
          </div>
        </div>
        <form>
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
        <button onClick={getSignature}>Join Meeting</button>
      </main>
    </div>
  );
}

export default App;
