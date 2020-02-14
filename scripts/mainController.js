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
    $scope.hide_translated_tables = true
    $scope.nounsAre = []
    $scope.prepositions = []
    $scope.antonymsAre = []
    $scope.synonyms = []
    $scope.recorded_value = ""
    window.SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
    $scope.recognition = new window.SpeechRecognition();


    $scope.translate_input_subwords = ""
    $scope.translate_output_subwords = ""


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
                "authorization": "Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiIyNDUzMTBhZTFlMzc0NzU1ODMxZTExZmQyMGRjMDg0MiIsImlhdCI6bnVsbCwiZXhwIjpudWxsLCJhdWQiOiIiLCJzdWIiOiIifQ.M1H_Z7WvwRPM0suBCofHs7iuDMMHyBjIRd3xGS4hqy8",
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
        $scope.hide_wave_image = true
        if ($scope.recorded_value != undefined || $scope.recorded_value !== "") {
            $scope.recognition.stop();
            $scope.translate($scope.recorded_value, function(response) {
                if (response.response_body != undefined) {
                    $scope.hide_translated_tables = false
                    $scope.translate_input_subwords = response.response_body[0].input_subwords
                    $scope.translate_output_subwords = response.response_body[0].output_subwords
                    $scope.safeApply()
                }
            });
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
                } else {
                    $scope.safeApply()
                    alert("I'm Sorry.. I couldn't able to get the nouns for you, Please try again")
                }
            })
            $scope.hide_record_stop_button = true;
            $scope.hide_record_play_button = true;
            $scope.hide_second_teacher = false
            $scope.hide_text_area = true
            $scope.hide_recorded_text = false
            $scope.hide_wave_image = true
        } else {
            $scope.hide_wave_image = false
            $scope.safeApply()
            alert("I'm Sorry.. I couldn't able to understand you, Please Speak Again")
        }

    }

    $scope.translate = function(message, cb) {
        var settings = {
            "async": true,
            "crossDomain": true,
            "url": "http://50.1.0.11:3003/translator/translation_en",
            "method": "POST",
            "headers": {
                "Content-Type": "application/json",
                "User-Agent": "PostmanRuntime/7.19.0",
                "Accept": "*/*",
                "Cache-Control": "no-cache",
                "Postman-Token": "0a357448-def3-47b2-beb2-c685d7ea60f1,bdbe7391-d38f-4087-a604-09a03a480fa0",
                "Host": "50.1.0.11:3003",
                "Accept-Encoding": "gzip, deflate",
                "Content-Length": "63",
                "Connection": "keep-alive",
                "cache-control": "no-cache"
            },
            "processData": false,
            "data": `[\n    {\n        \"src\": \"${message}\",\n        \"id\": 56\n    }\n]`
        }
        $.ajax(settings).done(function(response) {
            console.log(response);
            cb && cb(response)
        });
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