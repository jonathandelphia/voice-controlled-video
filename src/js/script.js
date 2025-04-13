////future features:
// crossfade changes (triggered by spoken numbers)

(function () {
  "use strict";

  // check for SpeechRecognition API
  if (!("webkitSpeechRecognition" in window)) {
    console.log("Speech recognition not supported");
    return false;
  }

  var myVids = [];
  var vidContainer = document.getElementsByClassName("vid-container")[0];
  var takeOverPhrases = [];

  // Load JSON data
  Promise.all([
    fetch("data/flower.json").then((response) => response.json()),
    fetch("data/takeover.json").then((response) => response.json()),
  ])
    .then(([flowerData, takeoverData]) => {
      myVids = flowerData;
      takeOverPhrases = takeoverData;

      // Create video elements from JSON
      for (var i = 0; i < myVids.length; i++) {
        var vidEl = document.createElement("video");
        vidEl.src = "video/" + myVids[i].name + ".mp4";
        vidEl.classList = "vid " + myVids[i].trigger;
        vidEl.id = myVids[i].trigger;
        vidEl.loop = true;
        vidEl.muted = true;
        vidEl.playsInline = true;
        vidContainer.appendChild(vidEl);
      }

      // Initialize speech recognition after videos are loaded
      initializeSpeechRecognition();
    })
    .catch((error) => {
      console.error("Error loading JSON data:", error);
    });

  var recognition = new webkitSpeechRecognition(),
    recognizing = false,
    ignoreOnEend,
    startTimestamp,
    recognizing,
    finalTranscript,
    lastLine = ""; // Track the last line of text

  // required DOM nodes
  var nodes = {
    start: document.querySelector("[data-start]"),
    speech: document.querySelector("[data-speech]"),
    speechInner: document.querySelector("[data-header]"),
    cube: document.querySelector("[data-vid]"),
    takeText: document.querySelector("[data-takeover]"),
  };

  function initializeSpeechRecognition() {
    // initialize speech recognition
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    // speech recognition started
    recognition.onstart = function () {
      recognizing = true;
      console.log("speech start");
    };

    // speech recognition end
    recognition.onend = function (event) {
      recognition.start(); //keep it going
      console.log("recognition ended");
      recognizing = false;
    };

    var duration = 0;

    // speech recognition result
    recognition.onresult = function (event) {
      // show speech recognition results

      // loop through results
      for (var i = event.resultIndex; i < event.results.length; ++i) {
        // store transcript and check for match
        var transcript = event.results[i][0].transcript.trim().toLowerCase(),
          match = checkForTrigger(transcript);

        // Only update and animate if the line has changed
        if (transcript !== lastLine) {
          lastLine = transcript;
          nodes.speechInner.innerHTML = transcript;

          // Remove and re-add animation class to trigger animation
          nodes.speechInner.classList.remove("animate-text");
          void nodes.speechInner.offsetWidth; // Force reflow
          nodes.speechInner.classList.add("animate-text");
        }

        if (transcript === takeOverPhrases[0].text) {
          console.log("didnt");
          $(".header").addClass("take");
        } else {
          $(".header").removeClass("take");
        }

        // we have a trigger match
        if (match) {
          for (var q = 0; q < myVids.length; q++) {
            var trig = myVids[q].trigger;

            var changeval = "1000";
            if (match.trigger == trig) {
              const trigVid = $("." + trig);
              duration = trigVid[0].duration * 1000;

              // Add active class to the triggered video first
              trigVid.addClass("active");
              trigVid[0].play();

              // After the fade-in transition completes, remove active class from other videos
              setTimeout(() => {
                $("video").not(trigVid).removeClass("active");
                $("video")
                  .not(trigVid)
                  .each(function () {
                    this.pause();
                    this.currentTime = 0;
                  });
              }, 1000); // Match the CSS transition duration

              const vidLength = trigVid[0].duration;
              if (!trigVid[0].paused && trigVid[0].currentTime > 2) {
                const vidLength = trigVid[0].duration;
                const trim = vidLength - 1;
                console.log(vidLength, trim);
                console.log("trim");
                trigVid[0].pause();
                trigVid[0].currentTime = 0;
                trigVid[0].play();
              }
              var video = VideoFrame({
                id: trigVid[0].id,
                frameRate: 24,
                callback: function (frame) {
                  var milliseconds = video.toMilliseconds();
                  var durationClip = duration * 0.975;
                  if (milliseconds > durationClip) {
                    video.video.pause();
                    video.video.currentTime = 0;
                    video.video.play();
                  }
                },
              });
              video.listen("frame");
            }
          }
        }
      }
    };

    // speech recognition error
    recognition.onerror = function (event) {
      console.log("Speech Recognition Error");
      console.log(event);
      recognition.stop();
    };

    // record btn - start / stop speech recognition
    nodes.start.addEventListener("click", function () {
      if (recognizing) {
        recognition.stop();
        recognizing = false;
        return;
      }

      recognition.start();
    });

    // speech visual - stop speech recognition
    nodes.speech.addEventListener("click", function () {
      recognition.stop();
    });
  }

  // accept speech recognition transcript
  // test for speech recognition trigger match
  // return object with matched trigger and css classes or false
  function checkForTrigger(check) {
    // Convert the check to lowercase for case-insensitive matching
    check = check.toLowerCase();

    // Search through the video configurations for a matching trigger
    for (var i = 0; i < myVids.length; i++) {
      var trigger = myVids[i].trigger;
      if (check.includes(trigger)) {
        return {
          class: trigger,
          trigger: trigger,
        };
      }
    }

    return false;
  }

  // instantiate material design modal JS
  $(document).ready(function () {
    // $('.modal-trigger').leanModal();
  });
})();
