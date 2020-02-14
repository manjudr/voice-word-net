var app = angular.module('myApp', []);
app.controller('myCtrl', function($scope, $rootScope, $http) {
    $scope.wave_image = "./assets/digital_audio_1.gif"
    $scope.talkingImage = "./assets/talking_teacher_3.gif"
    $scope.second_teacher = "./assets/talking_teacher_2.gif"
    $scope.play_button = "./assets/play-button.png"
    $scope.stop_button = "./assets/stop-button.png"
    $scope.dikshaImage = "./assets/logo.jpeg"
    $scope.hide_starting_page = false
    $scope.hide_talking_teacher = true
    $scope.hide_second_teacher = true
    $scope.hide_record_play_button = true
    $scope.hide_record_stop_button = true
    $scope.hide_recorded_text = true
    $scope.hide_wave_image = true
    $scope.hide_text_area = true
    $scope.hide_nouns_tables = true
    $scope.hide_pre_positions_tables = true
    $scope.nounsAre = ["smaple"]
    $scope.prepositions = ["pre"]
    $scope.antonymsAre = []
    $scope.synonyms = []
    $scope.recorded_value = ""
    window.SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
    $scope.recognition = new window.SpeechRecognition();

    $scope.textToSpeech = function(message) {
        console.log("yes")
        var msg = new SpeechSynthesisUtterance();
        var voices = window.speechSynthesis.getVoices();
        msg.voice = voices[30];
        msg.rate = 1
        msg.pitch = 1
        msg.text = message;
        msg.onend = function(e) {
            console.log("audio is played")
            $scope.hide_talking_teacher = true;
            $scope.hide_record_play_button = false
            $scope.hide_text_area = false
            $scope.safeApply()
        };
        speechSynthesis.speak(msg);
    }

    $rootScope.safeApply = function(fn) {
        var phase = this.$root.$$phase;
        if (phase == '$apply' || phase == '$digest') {
            if (fn && (typeof(fn) === 'function')) {
                fn();
            }
        } else {
            this.$apply(fn);
        }
    };

    $scope.analyzeMessage = function(message, cb) {
        var settings = {
            "async": true,
            "crossDomain": true,
            "url": "https://api.ekstep.in/language/v3/tools/text/analysis",
            "method": "POST",
            "headers": {
                "content-type": "application/json",
                "user-id": "ilimi",
                "accept-encoding": "UTF-8",
                "accept-charset": "UTF-8",
                "authorization": "",
                "cache-control": "no-cache",
                "postman-token": "9e2d700f-b653-af17-58d9-0f926a9407aa"
            },
            "processData": false,
            "data": `{\n  \"request\": {\n    \"language_id\": \"en\",\n    \"text\": \"${message}\"\n  }\n}`
        }
        console.log("settings" + JSON.stringify(settings))
        $.ajax(settings).done(function(response) {
            cb(response)
        });
    };

    $scope.startRecord = function() {
        console.log("recording..")
        $scope.hide_wave_image = false
        $scope.hide_record_play_button = true;
        $scope.hide_record_stop_button = false;

        $scope.recognition.continuous = true;
        $scope.recognition.onresult = (event) => {
            for (var i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    $scope.recorded_value = $scope.recorded_value.toString().concat(event.results[i][0].transcript)
                    console.log("Recorded Value is " + $scope.recorded_value)
                    $scope.safeApply()
                }
            }
        }
        $scope.recognition.onend = (event) => {
            console.log("end" + event)
        }
        $scope.recognition.start();
    }

    $scope.stopRecord = function() {
        $scope.recognition.stop();
        $scope.hide_wave_image = true
        $scope.analyzeMessage($scope.recorded_value, function(response) {
            console.log("response is" + JSON.stringify(response))
            if (response.result.text_complexity.top5) {
                $scope.nounsAre = response.result.text_complexity.top5.noun
                $scope.prepositions = response.result.text_complexity.top5.preposition
                if ($scope.nounsAre.length != 0) {
                    $scope.hide_nouns_tables = false
                }
                if ($scope.prepositions.length != 0) {
                    $scope.hide_pre_positions_tables = false
                }
                console.log("Nouns List is " + JSON.stringify($scope.nounsAre))
                $scope.hide_record_play_button = false
                $scope.hide_record_stop_button = true;
                $scope.hide_record_play_button = true;
                $scope.hide_second_teacher = false
                $scope.hide_text_area = true
                $scope.hide_recorded_text = false
            } else {
                $scope.hide_wave_image = false
                $scope.safeApply()
                alert("I'm Sorry.. I couldn't able to understand you, Please Speak Again")
                $scope.recognition.start()

            }

        })

    }

    $scope.start = function() {
        $scope.hide_starting_page = true
        $scope.hide_talking_teacher = false
        setTimeout(function() {
            $scope.textToSpeech("hello, how are you")
                //$scope.textToSpeech("Hello!!! Welcome to devcon event!!  Hope you have came here to learn about the antonyms and synonyms, Now I would request you to read something then i will find antonyms and synonyms for you!")
        }, 100)
    }






});