console.log("starting...")

const OPENAI_API_KEY = "YOUR KEY"

let mediaRecorder;
let recordedBlobs;

function handleDataAvailable(event) {
    console.log('handleDataAvailable', event);
    if (event.data && event.data.size > 0) {
      recordedBlobs.push(event.data);
    }
}

function startRecording() {
    recordedBlobs = [];
    try {
        mediaRecorder = new MediaRecorder(window.stream);
    } catch (e) {
      console.error('Exception while creating MediaRecorder:', e);
      errorMsgElement.innerHTML = `Exception while creating MediaRecorder: ${JSON.stringify(e)}`;
      return;
    }

    console.log('Created MediaRecorder', mediaRecorder);
    mediaRecorder.onstop = (event) => {
      console.log('Recorder stopped: ', event);
      console.log('Recorded Blobs: ', recordedBlobs);
      requestTranscript();
    };
    mediaRecorder.ondataavailable = handleDataAvailable;
    mediaRecorder.start();
    console.log('MediaRecorder started', mediaRecorder);
}

function stopRecording() {
    mediaRecorder.stop();
}

function requestTranscript() {
    var blob = recordedBlobs[0];
    var fileOfBlob = new File([blob], 'test.webm');
    const formData = new FormData();
    formData.append("file", fileOfBlob);
    formData.append("model", "whisper-1");
    const url = new URL("https://api.openai.com/v1/audio/transcriptions");
    const fetchOptions = {
        method: "POST",
        body: formData,
        headers: {
            "Authorization": "Bearer " + OPENAI_API_KEY
        }
      };      
    fetch(url, fetchOptions)
    .then((response) => response.json())
    .then((data) => {
        const elem = document.getElementById("result");
        elem.innerHTML = data.text;
      });
}


// Check if the browser supports the Web Audio API
if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
  // Access the microphone
  navigator.mediaDevices.getUserMedia({ audio: true })
    .then(function(stream) {
        window.stream = stream;
    })
    .catch(function(error) {
      console.error('Error accessing microphone:', error);
    });
} else {
  console.error('Web Audio API is not supported in this browser.');
}
