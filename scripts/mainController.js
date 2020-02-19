var app = angular.module('myApp', []);
app.controller('myCtrl', function($scope, $rootScope, $http) {
    $scope.wave_image = "./assets/digital_audio_1.gif"
    $scope.talkingImage = "./assets/talking_teacher_3.gif"
    $scope.second_teacher = "./assets/talking_teacher_2.gif"
    $scope.play_button = "./assets/play-button.png"
    $scope.stop_button = "./assets/stop-button.png"
    $scope.dikshaImage = "./assets/sunbird_logo.png"
    $scope.board_image = "./assets/blackboard.png"
    $scope.retry_image = "./assets/retry.png"
    $scope.crying_image = "./assets/crying_img5.gif"
    $scope.hide_starting_page = false
    $scope.hide_talking_teacher = true
    $scope.hide_second_teacher = true
    $scope.hide_record_play_button = true
    $scope.hide_record_stop_button = true
    $scope.hide_recorded_text = true
    $scope.hide_wave_image = true
    $scope.hide_text_area = true
    $scope.hide_board_image = true
    $scope.hide_nouns_tables = true
    $scope.hide_pre_positions_tables = true
    $scope.hide_translated_tables = true
    $scope.hide_thumbnail = true
    $scope.nounsAre = []
    $scope.prepositions = []
    $scope.antonymsAre = []
    $scope.word_list = []
    $scope.hide_retry_button = true
    $scope.recorded_value = ""
    $scope.hide_cryingImage = true

    $scope.search_word_result = []
        //$scope.search_word_thumbnails = [{ pictures: ["assets/03.jpg"], lemma: "jlfds" }, { pictures: ["assets/02.jpg"], lemma: "rewr" }]
    $scope.search_word_thumbnails = []
    window.speechRecognition = window.speechRecognition || window.webkitSpeechRecognition || window.mozSpeechRecognition || window.webkitSpeechRecognition;


    if (window.speechRecognition == undefined) {
        alert("Speech Recogniztion API Not Supported");
    }
    $scope.recognition = new window.speechRecognition();


    $scope.translate_input_subwords = ""
    $scope.translate_output_subwords = ""


    $scope.textToSpeech = function(message, hideDefaultConfig) {
        var msg = new SpeechSynthesisUtterance();
        var voices = window.speechSynthesis.getVoices();
        msg.voice = voices[48];
        console.log("voice" + msg.voice)
        msg.rate = 1
        msg.pitch = 1
        msg.text = message;
        msg.onend = function(e) {
            //  if (hideDefaultConfig) {
            $scope.hide_talking_teacher = true;
            $scope.hide_record_play_button = false
            $scope.hide_text_area = false
            $scope.hide_board_image = false
            $scope.safeApply()
                // }
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
                "authorization": appConfig.key,
                "cache-control": "no-cache",
                "postman-token": "9e2d700f-b653-af17-58d9-0f926a9407aa"
            },
            "processData": false,
            "data": `{\n  \"request\": {\n    \"language_id\": \"en\",\n    \"text\": \"${message}\"\n  }\n}`
        }
        $.ajax(settings).done(function(response) {
            cb(response)
        });
    };

    $scope.startRecord = function() {
        $scope.recorded_value = ""
        $scope.hide_wave_image = false
        $scope.hide_text_area = false
        $scope.hide_record_play_button = true;
        $scope.hide_record_stop_button = false;
        $scope.hide_board_image = false
        $scope.recognition.continuous = true;
        $scope.recognition.onresult = (event) => {
            for (var i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    $scope.recorded_value = $scope.recorded_value.toString().concat(event.results[i][0].transcript)
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
                    $scope.translate_input_subwords = response.response_body[0].input_subwords.replace(/[^\w\s]/gi, "")
                    $scope.translate_output_subwords = response.response_body[0].output_subwords.replace('~[^\p{M}\w]+~u', '');
                    $scope.safeApply()
                }
            });
            $scope.analyzeMessage($scope.recorded_value, function(response) {
                if (response.result.text_complexity.top5 && response.result.text_complexity.top5.noun) {
                    $scope.nounsAre = response.result.text_complexity.top5.noun
                    var rhymingList = []
                    var rhymingObj = {}
                    $scope.nounsAre.forEach(noun => {
                        $scope.getRhymingWords(noun, function(rhymingResponse) {
                            rhymingObj["word"] = noun;
                            rhymingObj["rhymingsList"] = rhymingResponse
                            rhymingList.push(rhymingObj)
                        })
                    })

                    setTimeout(function() {
                        $scope.searchNouns($scope.nounsAre, function(response) {
                            if (response.result.count > 0) {
                                response.result.words.forEach(element => {
                                    $scope.getSynonyms(element.synonyms, function(synResponse) {
                                        if (synResponse != undefined) {
                                            var words_map = {
                                                key: element.lemma,
                                                synonyms: $scope.getAsList(synResponse, "synonyms"),
                                                holonyms: $scope.getAsList(synResponse, "holonyms"),
                                                picture: element.pictures,
                                                meaning: element.meaning,
                                                example: (element.exampleSentences) && element.exampleSentences[0],
                                                rhymingWords: ""
                                            }
                                            console.log("rhymingList" + JSON.stringify(rhymingList))
                                            rhymingList.forEach(rhyming => {
                                                if (rhyming.word === words_map["key"]) {
                                                    words_map.rhymingWords = rhyming["rhymingsList"]
                                                }
                                            })
                                            $scope.word_list.push(words_map)
                                        }

                                    })
                                })
                                $scope.hide_nouns_tables = false
                            } else {
                                $scope.hide_nouns_tables = true
                            }
                        })
                        $scope.prepositions = response.result.text_complexity.top5.preposition
                        if ($scope.nounsAre && $scope.nounsAre.length != 0) {

                        }
                        if ($scope.prepositions && $scope.prepositions.length != 0) {
                            $scope.hide_pre_positions_tables = false
                        }
                        setTimeout(function() {
                            $scope.explainTable()
                                // $scope.word_list.forEach(element => {
                                //     message = message.concat(` The ${element.key} is basically ${element.meaning}`)
                                //     $scope.explainTable(message)
                                // })
                                // $scope.hide_second_teacher = false
                                // $scope.hide_retry_button = false
                            $scope.safeApply()

                        }, 1000)

                    }, 1000)

                } else {
                    $scope.safeApply()
                        //alert("I'm Sorry.. I couldn't able to get the nouns for you, Please try again");
                    var msg = new SpeechSynthesisUtterance();
                    var voices = window.speechSynthesis.getVoices();
                    msg.voice = voices[48];
                    msg.rate = 1
                    msg.pitch = 1
                    msg.text = "I apologize, I couldn't  able to find anything, I request you to please click on the replay button"
                    speechSynthesis.speak(msg);
                    $scope.hide_retry_button = false
                    $scope.hide_second_teacher = false
                    $scope.hide_cryingImage = false
                    $scope.safeApply()
                    msg.onend = function(e) {
                        $scope.hide_second_teacher = true
                        $scope.safeApply()
                    }
                }
            })
            $scope.hide_record_stop_button = true;
            $scope.hide_record_play_button = true;
            //$scope.hide_second_teacher = false
            $scope.hide_text_area = true
            $scope.hide_board_image = true
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
            cb && cb(response)
        });
    }
    $scope.start = function() {
        $scope.hide_starting_page = true
        $scope.hide_talking_teacher = false
        $scope.hide_board_image = false
        var name = $scope.getParameterByName('userName') || ""
        console.log("name is" + name)
        setTimeout(function() {
            //$scope.textToSpeech("hello, how are you", true)
            $scope.textToSpeech(`Hello!!! ${name} Welcome to devcon event!!  Let's learn about the parts of speech, Now I would request you to read something then i will find words, it's related images, examples and it's meaning for you!`)
        }, 100)
    }

    $scope.searchNouns = function(nouns, cb) {
        var nounsList = undefined
        if (nouns != undefined) {
            nounsList = JSON.stringify(nouns)
        }
        var settings = {
            "async": true,
            "crossDomain": true,
            "url": "https://api.ekstep.in/language/v3/search",
            "method": "POST",
            "headers": {
                "content-type": "application/json",
                "user-id": "ilimi",
                "accept-encoding": "UTF-8",
                "accept-charset": "UTF-8",
                "authorization": appConfig.key,
                "cache-control": "no-cache",
                "postman-token": "26a73f06-26be-d070-139a-0534e0d3ba9a"
            },
            "processData": false,
            "data": `{"request":{"filters":{"lemma":${nounsList},"objectType":["Word"],"language_id":["en"]}}}`
        }
        $.ajax(settings).done(function(response) {
            cb && cb(response)
        });
    }

    $scope.getSynonyms = function(wordIds, cb) {
        var res = []
        var count = 0
        wordIds.forEach(id => {
            var settings = {
                "async": true,
                "crossDomain": true,
                "url": `https://api.ekstep.in/language/v3/synsets/read/${id}?language_id=en`,
                "method": "GET",
                "headers": {
                    "content-type": "application/json",
                    "user-id": "ilimi",
                    "accept-encoding": "UTF-8",
                    "accept-charset": "UTF-8",
                    "authorization": appConfig.key,
                    "cache-control": "no-cache",
                    "postman-token": "bad884b9-6532-b5c9-1a78-288152fd9f62"
                }
            }
            $.ajax(settings).done(function(response) {
                res.push(response.result)
                count++
                if (count === wordIds.length) {
                    cb(res)
                }
            });
        })
    }

    $scope.getAsList = function(request, type) {
        var names = []
        request.forEach(element => {
            if (element.Synset[type] != undefined && element.Synset[type].length > 0) {
                element.Synset[type].forEach(key => {
                    names.push(key.name)
                })
            }
        })
        return names.splice(0, 3).toString()
    }


    $scope.getRhymingWords = function(word, cb) {
        var rhymingWords = []
        $.ajax({
            "async": true,
            "crossDomain": true,
            "url": "https://api.ekstep.in/language/v3/tools/rhymingwords/list",
            "method": "POST",
            "headers": {
                "content-type": "application/json",
                "user-id": "rayuluv",
                "authorization": appConfig.key,
                "cache-control": "no-cache",
                "postman-token": "5ab06d4f-b2f5-8a1b-d6be-d271a2f6a408"
            },
            "processData": false,
            "timeout": 2000,
            "data": `{\n    \"request\": {\n     \"language_id\":\"en\",\n     \"lemma\":\"${word}\"\n    }\n}`,
            success: function(response, textStatus, jqXHR) {
                console.log("success" + response)
                if (response.result != undefined && response.result.words != undefined) {
                    response.result.words.forEach(word => {
                        rhymingWords.push(word.lemma)
                    })
                    cb(rhymingWords.splice(0, 4).toString())
                }
            },
            error: function(jqXHR, textStatus, errorThrown) {
                console.log("error" + textStatus)
                cb("")
            }
        });

    }
    $scope.explainTable = function() {
        $scope.hide_second_teacher = false
        $scope.hide_retry_button = false
        var msg = new SpeechSynthesisUtterance();
        var voices = window.speechSynthesis.getVoices();
        msg.voice = voices[48];
        msg.rate = 1
        msg.pitch = 1
        var message = ""
        if ($scope.word_list.length > 0) {
            message = `Hey My dear student! I found these are the results for you!, The words which i got are ${$scope.nounsAre.toString()}, `;
        } else {
            message = "I apologize, I couldn't  able to find anything, I request you to please click on the replay button"
            $scope.hide_cryingImage = false
        }


        var elements = $scope.word_list.filter(item => item.meaning != undefined);
        var firstElement = elements[0] ? elements[0] : { key: "", "meaning": "" }

        if ($scope.word_list.length > 0) {
            msg.text = message.concat(` The ${firstElement.key} is basically ${firstElement.meaning}`)
        } else {
            msg.text = message
        }
        console.log("mesage" + msg.text)
        speechSynthesis.speak(msg);
        msg.onend = function(e) {
            $scope.hide_second_teacher = true
            $scope.safeApply()
        }
    }

    $scope.retry = function() {
        console.log("retry")
        $scope.startRecord()
        $scope.hide_nouns_tables = true
        $scope.hide_record_stop_button = true
        $scope.hide_record_play_button = false
        $scope.hide_translated_tables = true
        $scope.hide_wave_image = true
        $scope.hide_retry_button = true
        $scope.hide_recorded_text = true
        $scope.hide_cryingImage = true
        $scope.word_list = []
        $scope.safeApply()



    }

    $scope.getParameterByName = function(name, url) {
        if (!url) url = window.location.href;
        name = name.replace(/[\[\]]/g, '\\$&');
        var regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)'),
            results = regex.exec(url);
        if (!results) return null;
        if (!results[2]) return '';
        return decodeURIComponent(results[2].replace(/\+/g, ' '));
    }
    var voices = window.speechSynthesis.getVoices();
});