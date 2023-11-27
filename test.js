console.log("starting...")

const OPENAI_API_KEY = "APIKEY"

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
        const elem = document.getElementById("convo");
        const newDiv = document.createElement("div");
        newDiv.innerHTML = "You: " + data.text;
        elem.appendChild(newDiv);
        getChatResponse(data.text);
      });
}

function getChatResponse(prompt) {
    const url = new URL("https://api.openai.com/v1/chat/completions");
    var body = {
        "model": "gpt-3.5-turbo",
        "messages": [
          {
            "role": "system",
            "content": "You are Elsa from Frozen. I'm asking you questions."
          },
          {
            "role": "user",
            "content": prompt
          }
        ]
      };
    

    const fetchOptions = {
        method: "POST",
        body: JSON.stringify(body),
        headers: {
            "Authorization": "Bearer " + OPENAI_API_KEY,
            "Content-Type": "application/json"
        }
      };      
    fetch(url, fetchOptions)
    .then((response) => response.json())
    .then((data) => {
        const elem = document.getElementById("convo");
        const newDiv = document.createElement("div");
        const response = data.choices[0].message.content
        newDiv.innerHTML = "AI: " + response;
        elem.appendChild(newDiv);
        createSpeech(response);
      });

}

function createSpeech(response) {
    const url = new URL("https://api.openai.com/v1/audio/speech");
    var body = {
        "model": "tts-1",
        "input": response,
        "voice": "nova",
        "response_format": "mp3"
      };
    const fetchOptions = {
        method: "POST",
        body: JSON.stringify(body),
        headers: {
            "Authorization": "Bearer " + OPENAI_API_KEY,
            "Content-Type": "application/json"
        }
      };      
    fetch(url, fetchOptions)
    .then((response) => {
        response.blob()
        .then((blob) => {
            const blobUrl = URL.createObjectURL(blob);
            window.audio = new Audio();
            window.audio.src = blobUrl;
            window.audio.controls = true;
            document.body.appendChild(window.audio);
            window.audio.play();
        });
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
