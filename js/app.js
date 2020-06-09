var app = angular.module('app', []);
// var api = 'https://mysterious-badlands-68636.herokuapp.com';
var api = 'http://localhost:5000';

app.controller('BigFiveController', function($scope, $http, $window) {
  $http({
    method: 'GET',
    url: api + '/bigFiveQuestions'
  }).then(function(response) {
    $scope.questions = response.data;
    document.getElementById('userId').value = $window.sessionStorage.getItem('userId');
  }, function(error) {
    console.log("Error occured when loading the big five questions");
  });

});

app.controller('IndexController', function($scope, $http, $window) {

  $scope.user = {};
  $scope.user.structure = false;
  $scope.user.socialPresence = true;
  $scope.user.firstVisit = true;

  $("#profileImage").click(function(e) {
    $("#imageUpload").click();
  });

  $("#imageUpload").change(function() {
    fasterPreview(this);
  });

  function fasterPreview(uploader) {
    if (uploader.files && uploader.files[0]) {
      $('#profileImage').attr('src',
        window.URL.createObjectURL(uploader.files[0]));
      $('#ImageLabel').css("display", "none");
      $scope.profilePicture = uploader.files[0];
    }
  }

  $('#gender-specified').change(function() {
    if (this.checked) {
      $('#gender-text').prop('required', true);
    } else {
      $('#gender-text').prop('required', false);
    }
  });

  $scope.showPassword = function() {
    var x = document.getElementById("userPassword");
    if (x.type === "password") {
      x.type = "text";
    } else {
      x.type = "password";
    }
  };

  $scope.showSignIn = function() {
    $("#signup-container").css("display", "none");
    $("#login-container").css("display", "block");
  }

  $scope.showSignUp = function() {
    $("#signup-container").css("display", "block");
    $("#login-container").css("display", "none");
  }

  $scope.login = function(user) {
    if (user.email && user.password) {

      $("#sign-up-loader").css("display", "block");
      $("#index-signup").attr('disabled', true);
      $("#index-signup").css('background-color', 'grey');
      $(".input-text").attr('disabled', true);

      console.log(user);
      new Promise(function(resolve, reject) {
        $http({
          method: 'POST',
          url: api + '/login',
          data: user,
          type: JSON,
        }).then(function successCallback(response) {

          $("#sign-up-loader").css("display", "none");
          $window.sessionStorage.setItem('user', JSON.stringify(response.data));

          if (response.data.firstVisit == true){
            $window.location.href = './intro.html';
          } else {
            $window.location.href = './home.html';
          }


        }, function errorCallback(response) {

          if (response.data == "Invalid email address. Please try again."){
            $scope.user.email = "";
          } else {
            $scope.user.password = "";
          }
          alert(response.data);
          $("#sign-up-loader").css("display", "none");
          $(".input-text").attr('disabled', false);
          $("#index-signup").attr('disabled', false);
          $("#index-signup").css('background-color', '#117A65');

          console.log("Error occured when submitting user details");
        });
      });
    }
  };

  $scope.submitDetails = function(user) {

    if ((user.socialPresence == true ? $scope.profilePicture : true) && (user.socialPresence == true ? user.name : true) && user.email && user.password && user.gender && user.age && user.education && user.field && (user.gender == 'specified' ? user.genderSpecified : true) && (user.age >= 18)) {

      $("#index-next").attr('disabled', true);
      $("#passwordCheck").attr('disabled', true);
      $("#profile-container").attr('disabled', true);
      $("#imageUpload").attr('disabled', true);
      $(".input-text").attr('disabled', true);
      $(".specify-text").attr('disabled', true);
      $(".radio-button").attr('disabled', true);

      $("#index-next").css('background-color', 'grey');
      $("#index-loader").css("display", "block");

      $http({
        method: 'POST',
        url: api + '/user',
        headers: {
          'Content-Type': undefined
        },
        data: {
          profilePicture: $scope.profilePicture,
          name: $scope.user.name,
          email: $scope.user.email,
          password: $scope.user.password,
          age: $scope.user.age,
          gender: $scope.user.gender,
          genderSpecified: $scope.user.genderSpecified,
          education: $scope.user.education,
          field: $scope.user.field,
          structure : $scope.user.structure,
          socialPresence : $scope.user.socialPresence
        },
        transformRequest: function(data, headersGetter) {
          var formData = new FormData();
          angular.forEach(data, function(value, key) {
            formData.append(key, value);
          });

          var headers = headersGetter();
          delete headers['Content-Type'];
          return formData;
        }
      }).then(function successCallback(response) {
        //Set up the right user information here
        $window.sessionStorage.setItem('user', JSON.stringify(response.data));
        $window.location.href = './intro.html';
      }, function errorCallback(response) {
        if (response.status == 401){
          alert(response.data);
        }
        console.log("Error occured when submitting user details");
        $window.location.href = './index.html';

      });

    }
  };
});

app.controller('IntroController', function ($scope, $http, $window, $interval) {
  $scope.user = JSON.parse($window.sessionStorage.getItem('user'));
  $scope.group = [];

  var stop;
  $scope.getGroupUsers = function() {
    if (angular.isDefined(stop)) return;
    stop = $interval(function() {
      if ($scope.group.length == 9) {
        //Stop checking and enable button
        $scope.stopChecking();
        $("#intro-start").attr("disabled", false);
        $("#intro-start").css("background-color", "#117A65");
        $("#intro-start").css("border", "1px solid #117A65");
      } else {
        //HTTP call to get users
        $http({
          method: 'POST',
          url: api + '/usergroup',
          data: {
            userId : $scope.user.userId,
            socialPresence: $scope.user.socialPresence,
            structure: $scope.user.structure
          },
          type: JSON,
        }).then(function(response) {
          $scope.group = response.data;
        }, function(error) {
          console.log("Error occured while checking users in the group");
        });
      }
    }, 10000);
  };

  $scope.stopChecking = function() {
    if (angular.isDefined(stop)) {
      $interval.cancel(stop);
      stop = undefined;
    }
  };
  $scope.getGroupUsers();

  $scope.start = function() {
    $("#intro-start").attr("disabled", true);
    $("#intro-start").css("background-color", "grey");
    $("#intro-start").css("border", "1px solid grey");
    $("#intro-loader").css("display", "block");

    //Update that the user has started the discussion
    $http({
      method: 'POST',
      url: api + '/updateuser',
      data: {
        userId : $scope.user.userId,
        firstVisit : false
      },
      type: JSON,
    }).then(function(response) {
        $("#intro-loader").css("display", "none");
        $window.location.href = './home.html';

    }, function(error) {
      console.log("Error occured while updating user status");
    });
  };

});



app.controller('HomeController', function($scope, $http, $window) {

  $scope.currentQIndex = 0;

  $scope.userId = $window.sessionStorage.getItem('userId');
  $scope.cues = $window.sessionStorage.getItem('cues');
  $scope.visibility = $window.sessionStorage.getItem('visibility');
  $scope.discussion = $window.sessionStorage.getItem('discussion');
  $scope.myAvatar = $window.sessionStorage.getItem('avatar');
  // $scope.set = $window.sessionStorage.getItem('set');
  $scope.order = JSON.parse($window.sessionStorage.getItem('order'));
  $scope.currentUsername = $window.sessionStorage.getItem('username');
  $scope.IsUpdated = false;

  $scope.question = {};
  $scope.sliderChanged = false;
  // $scope.explained = false;
  $scope.onbeforeunloadEnabled = true;
  $scope.count = 0;
  var x;

  $scope.startTimer = function() {
    // Set the date we're counting down to
    var dt = new Date();
    dt.setMinutes(dt.getMinutes() + 2);
    var countDownDate = dt;

    // Update the count down every 1 second
    x = setInterval(function() {
      // Get today's date and time
      var now = new Date().getTime();
      // Find the distance between now and the count down date
      var distance = countDownDate - now;
      var minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      var seconds = Math.floor((distance % (1000 * 60)) / 1000);

      // Display the result in the element with id="demo"
      document.getElementById("timer").innerHTML = "Time remaining : " + minutes + "m " + seconds + "s ";

      // If the count down is finished, write some text
      if (distance < 0) {
        //Stop the timer
        clearInterval(x);
        $("#timer").css("display", "none");
        document.getElementById("timer").innerHTML = "Time remaining : 2m 00s";

        //Ask them to change now
        socket.emit('time_up', {
          'message': "Time is up! You may change your answer if you want now.",
          'username': "QuizBot",
          'avatar': "qb.png"
        });
        $("#change-section").css("display", "block");
        //Disable the chat till next discussion
        $("#chat-text").attr("disabled", true);
        $(".send-button").css("background-color", "grey");
        $(".send-button").css("border", "1px solid grey");

        $timeout(function() {
          $scope.scrollAdjust();
        }, 500);
      }
    }, 500);
  };

  $("input[type='range']").change(function() {
    if ($scope.IsUpdated) {
      $scope.myAnswer.selectedUpdatedConf = $scope.getTimestampForEvents();
    } else {
      $scope.myAnswer.selectedConf = $scope.getTimestampForEvents();
    }

    $scope.sliderChanged = true;
    $("#output").css("color", "green");
    $("#confidence-container").css("border", "none");
    $("#submit-button").css("display", "block");
    $(".explanation-box").css("border-color", "grey");

  });

  function shuffle(a) {
    var j, x, i;
    for (i = a.length - 1; i > 0; i--) {
      j = Math.floor(Math.random() * (i + 1));
      x = a[i];
      a[i] = a[j];
      a[j] = x;
    }
    return a;
  };

  //Setting question one
  $http({
    method: 'POST',
    url: api + '/question',
    data: {
      id: $scope.order[$scope.currentQIndex]
    },
    type: JSON,
  }).then(function(response) {
    $scope.currentQIndex += 1;
    $scope.question = response.data;
    if ($scope.question.img) {
      $("#image-container").css("display", "inline");
    } else {
      $("#image-container").css("display", "none");
    }

    if ($scope.discussion == 'No') {
      $("#question-area").css("display", "inline");
      $("#qBox").css("border", "solid red");
      $scope.myAnswer.sawQuestion = $scope.getTimestampForEvents();
    }

  }, function(error) {
    console.log("Error occured when getting the first question");
  });

  //Confirmation message before reload and back
  $window.onbeforeunload = function(e) {
    if ($scope.onbeforeunloadEnabled) {
      var dialogText = 'You have unsaved changes. Are you sure you want to leave the site?';
      e.returnValue = dialogText;

      //Disconnect sockets if there are any
      if ($scope.discussion == 'Yes') {
        socket.disconnect();
      }
      return dialogText;
    }
  };

  //Initialization
  $scope.count = 0;
  $scope.myAnswer = {};
  $scope.myAnswer.confidence = 50;
  $scope.myAnswer.userId = $scope.userId;
  $scope.myAnswer.cues = $scope.cues;
  $scope.myAnswer.discussion = $scope.discussion;

  //Show only when the answer is selected
  $scope.clicked = function() {
    if ($scope.IsUpdated) {
      $scope.myAnswer.selectedUpdatedOption = $scope.getTimestampForEvents();
    } else {
      $scope.myAnswer.selectedOption = $scope.getTimestampForEvents();
    }

    //Resetting the red line
    if ($scope.currentQIndex == 1) {
      $("#qBox").css("border", "none");
      $("#confidence-container").css("display", "block");
      if (!$scope.sliderChanged) {
        $("#confidence-container").css("border", "solid red");
      }
    } else {
      $("#confidence-container").css("display", "block");
    }
  };

  $scope.submitAnswer = function() {
    if ($scope.sliderChanged) {
      $scope.myAnswer.clickedSubmit = $scope.getTimestampForEvents();
      //Remove the button
      $("#submit-button").css("display", "none");
      //Disbling the input
      $("input[type=radio]").attr('disabled', true);
      $("input[type=range]").attr('disabled', true);
      //Loader activated
      $("#loader").css("display", "block");
      $("#loader-text").css("display", "block");
      $("#progress-bar").css("display", "block");

      //Disable chat box
      $("#chat-text").attr("disabled", true);
      $(".send-button").css("background-color", "grey");
      $(".send-button").css("border", "1px solid grey");

      $scope.myAnswer.answerId = parseInt($scope.myAnswer.answerId);
      $scope.myAnswer.questionId = $scope.question.questionNumber;
      $scope.myAnswer.userId = $scope.userId;
      $scope.myAnswer.cues = $scope.cues;
      $scope.myAnswer.discussion = $scope.discussion;
      $scope.myAnswer.visibility = $scope.visibility;
      $scope.myAnswer.myAvatar = $scope.myAvatar;
      $scope.myAnswer.username = $scope.currentUsername;

      $http({
        method: 'POST',
        url: api + '/feedback',
        data: $scope.myAnswer,
        type: JSON,
      }).then(function(response) {
        $scope.myAnswer.answerId = $scope.myAnswer.answerId.toString();
        $scope.showTicks(response, false);
      }, function(error) {
        console.log("Error occured when loading the feedback");
      });
    }
  };

  //For private condition
  $scope.update = function() {
    if ($scope.sliderChanged) {
      $scope.myAnswer.submittedUpdatedAnswer = $scope.getTimestampForEvents();
      //Remove the question area and chart area
      $("#question-area").css("display", "none");
      $("#chart-area").css("display", "none");

      $("#change-section-nd").css("display", "none");
      $("#change-section").css("display", "none");

      //Disable the button
      $("#submit-button").attr("disabled", "disabled");
      $("#confidence-container").css("display", "none");

      $scope.myAnswer.answerId = parseInt($scope.myAnswer.answerId);
      $scope.myAnswer.questionId = $scope.question.questionNumber;
      $scope.myAnswer.userId = $scope.userId;

      $http({
        method: 'POST',
        url: api + '/updateAnswer',
        data: $scope.myAnswer,
        type: JSON,
      }).then(function(response) {
        $scope.next();
      }, function(error) {
        console.log("Error occured when updating the answers");
      });
    }
  };

  $scope.next = function() {

    $scope.myAnswer.selectedNext = $scope.getTimestampForEvents();

    $("#change-section").css("display", "none");
    $("#change-section-nd").css("display", "none");
    $("#updated-change-section").css("display", "none");
    $("#updated-change-section-nd").css("display", "none");

    $http({
      method: 'POST',
      url: api + '/updateAnswerWithEvents',
      data: $scope.myAnswer,
      type: JSON,
    }).then(function(response) {
      $scope.IsUpdated = false;
      //Remove the question area and chart area
      $("#question-area").css("display", "none");
      $("#chart-area").css("display", "none");
      $("#updated_div").css("display", "none");

      $scope.count = 0;

      //Make the input enabled and submit invisible
      $("input[type=radio]").attr('disabled', false);
      $("input[type=range]").attr('disabled', false);

      $("#submit-button").css("display", "none");
      $("#confidence-container").css("display", "none");

      //Handling the ending of the quiz and directing to the big five questionnaire
      if ($scope.currentQIndex == 18) {
        //Disable the confirmation message
        $scope.onbeforeunloadEnabled = false;
        //Save chat messages to the database
        if ($scope.discussion == 'Yes') {
          var data = {
            userId: $scope.userId,
            chats: JSON.parse(angular.toJson($scope.history))
          };

          $http({
            method: 'POST',
            url: api + '/saveChats',
            data: data,
            type: JSON,
          }).then(function(response) {
              console.log("Chat messages saved successfully.");
              $window.location.href = './big-five.html';
              socket.emit('quiz_completed', {
                'message': 'Quiz completed!',
                'username': 'QuizBot',
                'avatar': 'qb.png'
              });
            },
            function(error) {
              console.log("Error occured when saving the chat messages.");
            });
        } else {
          //No Discussion
          $window.location.href = './big-five.html';
        }
      } else {
        $scope.userId = $window.sessionStorage.getItem('userId');
        var data = {
          id: $scope.order[$scope.currentQIndex]
        };

        $http({
          method: 'POST',
          url: api + '/question',
          data: data,
          type: JSON,
        }).then(function(response) {
          socket.emit('new_question', {
            'message': 'Moving to question ' + ($scope.currentQIndex + 1) + '/18.',
            'username': 'QuizBot',
            'avatar': 'qb.png',
            'info': response.data
          });
          //Disable the chat till next discussion
          $("#chat-text").attr("disabled", true);
          $(".send-button").css("background-color", "grey");
          $(".send-button").css("border", "1px solid grey");

          //Display the new question area and chart area
          $("#question-area").css("display", "block");
          $("#chart-area").css("display", "block");

          $scope.myAnswer = {};
          $scope.sliderChanged = false;
          $scope.explained = false;
          $scope.myAnswer.confidence = 50;
          $scope.question = response.data;
          $scope.myAnswer.sawQuestion = $scope.getTimestampForEvents();

          if ($scope.question.img) {
            $("#image-container").css("display", "inline");
          } else {
            $("#image-container").css("display", "none");
          }

          $("#loader").css("display", "none");
          $("#loader-text").css("display", "none");
          $("#chart_div").css("display", "none");

          $("#change-section").css("display", "none");
          $("#change-section-nd").css("display", "none");

          $("#submit-button").prop("disabled", false);
          $("#output").val("Not Specified");
          $("#output").css("color", "red");

          $scope.currentQIndex += 1;

        }, function(error) {
          console.log("Error occured when loading the question");
        });
      }
    }, function(error) {
      console.log("Error occured while saving answer events");
    });
  };

  //Function to adjust scrolling - not working
  $scope.scrollAdjust = function() {
    var element = document.getElementById("text-area");
    element.scrollTop = element.scrollHeight;
  };

  //Function to get timestamp for the chat
  $scope.getTimestamp = function() {
    var dt = new Date();
    dt.setHours(dt.getHours() + 10);
    return dt.toUTCString();
  };

  //Function to get timestamp for events
  $scope.getTimestampForEvents = function() {
    var dt = new Date();
    return dt;
  };


  //Connecting the client to the socket
  $scope.userState = 'ready';
  $scope.history = [];
  var socket = io.connect('https://mysterious-badlands-68636.herokuapp.com');
  // var socket = io.connect('http://localhost:5000');
  socket.emit('new_connection', {
    'username': $scope.currentUsername,
    'avatar': $scope.myAvatar
  });

  $timeout(function() {
    $scope.history.push({
      name: "QuizBot",
      avatar: "qb.png",
      timestamp: $scope.getTimestamp(),
      msg: "Hello " + $scope.currentUsername + "! Welcome to the quiz. This quiz contains 18 multilple-choice questions. You will be asked to answer each of them, with four other participants."
    });
  }, 1000);

  $timeout(function() {
    $scope.scrollAdjust();
  }, 1000);

  $timeout(function() {
    $scope.history.push({
      name: "QuizBot",
      avatar: "qb.png",
      timestamp: $scope.getTimestamp(),
      msg: "You will first answer each question individually. Next, you will see group answers. Then you may discuss the group's answers through this chat. Subsequent to the group discussion, you can make changes to your answer, confidence level or explanation."
    });
  }, 3000);

  $timeout(function() {
    $scope.scrollAdjust();
  }, 3000);

  //When you get the start signal
  socket.on('ready', (data) => {
    $("#chat-text").attr("disabled", false);
    $(".send-button").css("background-color", "#117A65");
    $(".send-button").css("border", "1px solid #117A65");

    $scope.history.push({
      name: data.username,
      msg: data.message,
      timestamp: $scope.getTimestamp(),
      avatar: data.avatar
    });
    $timeout(function() {
      $scope.scrollAdjust();
    }, 500);

    $timeout(function() {
      $scope.history.push({
        name: "QuizBot",
        avatar: "qb.png",
        timestamp: $scope.getTimestamp(),
        msg: "Type 'GO' to start the quiz."
      });
    }, 1500);

    $timeout(function() {
      $scope.scrollAdjust();
    }, 1500);

  });

  //When you receive a new broadcast message
  socket.on('new_message', (data) => {
    $timeout(function() {
      $scope.history.push({
        name: data.username,
        msg: data.message,
        class: data.class,
        timestamp: $scope.getTimestamp(),
        avatar: data.avatar
      });
    }, 100);

    $timeout(function() {
      $scope.scrollAdjust();
    }, 500);
  });

  //When you receive a done signal
  socket.on('done', (data) => {

    $("#timer").css("display", "none");
    clearInterval(x);
    document.getElementById("timer").innerHTML = "Time remaining : 2m 00s";

    $timeout(function() {
      $scope.history.push({
        name: data.username,
        msg: data.message,
        class: data.class,
        timestamp: $scope.getTimestamp(),
        avatar: data.avatar
      });
    }, 500);

    $timeout(function() {
      $scope.scrollAdjust();
    }, 600);

    $timeout(function() {
      $scope.history.push({
        name: "QuizBot",
        avatar: "qb.png",
        timestamp: $scope.getTimestamp(),
        msg: "You may change your answer and confidence now."
      });
    }, 1000);

    $timeout(function() {
      $scope.scrollAdjust();
    }, 1100);
    //Show change box
    $timeout(function() {
      $("#change-section").css("display", "block");
      //Disable the chat till next discussion
      $("#chat-text").attr("disabled", true);
      $(".send-button").css("background-color", "grey");
      $(".send-button").css("border", "1px solid grey");
    }, 1500);
  });

  //When you receive the time up
  socket.on('time_up', (data) => {

    clearInterval(x);
    $("#timer").css("display", "none");
    document.getElementById("timer").innerHTML = "Time remaining : 2m 00s";

    $timeout(function() {
      $scope.history.push({
        name: data.username,
        msg: data.message,
        class: data.class,
        timestamp: $scope.getTimestamp(),
        avatar: data.avatar
      });
    }, 100);

    $timeout(function() {
      $scope.scrollAdjust();
    }, 500);
  });

  //On next question
  socket.on('new_question', (data) => {
    $timeout(function() {
      $scope.history.push({
        name: data.username,
        msg: data.message,
        class: data.class,
        timestamp: $scope.getTimestamp(),
        avatar: data.avatar
      });
      $scope.scrollAdjust();
    }, 100);

    $timeout(function() {
      $scope.scrollAdjust();
    }, 500);
  });

  //When someone connected to the channel
  socket.on('connected', (data) => {
    $scope.history.push({
      msg: data.message,
      class: data.class,
      timestamp: $scope.getTimestamp()
    });
    $timeout(function() {
      $scope.scrollAdjust();
      $("#chat-text").focus();
    }, 1000);
  });

  $scope.go = function() {
    socket.emit('started', {
      'username': $scope.currentUsername,
      'question': $scope.question
    });

    $("#question-area").css("display", "inline");
    $("#qBox").css("border", "solid red");
    $scope.myAnswer.sawQuestion = $scope.getTimestampForEvents();

    //Disable chat box
    $("#chat-text").attr("disabled", true);
    $(".send-button").css("background-color", "grey");
    $(".send-button").css("border", "1px solid grey");

    $scope.userState = "started"; //Started the quiz
  };


  //Call sendMessage on Enter
  var chatBox = document.getElementById("chat-text");

  // Execute a function when the user releases a key on the keyboard
  chatBox.addEventListener("keyup", function(event) {
    // Cancel the default action, if needed
    event.preventDefault();
    // Number 13 is the "Enter" key on the keyboard
    if (event.keyCode === 13) {
      document.getElementById("sendButton").click();
    }
  });

  $scope.sendMessage = function() {
    if ($scope.message != undefined && $scope.message.trim().length != 0) {
      //Handle requests
      var handle = $scope.message.toLowerCase();
      if (handle == 'go') {
        if ($scope.userState == "ready") {
          $scope.history.push({
            name: $scope.currentUsername,
            msg: $scope.message,
            timestamp: $scope.getTimestamp(),
            avatar: $scope.myAvatar
          });
          $scope.go();

        } else {
          $scope.history.push({
            name: "QuizBot",
            avatar: "qb.png",
            timestamp: $scope.getTimestamp(),
            msg: "You have already started the quiz."
          });
        }
        $scope.message = "";
      } else if (handle == "done") {

        $("#timer").css("display", "none");
        clearInterval(x);
        document.getElementById("timer").innerHTML = "Time remaining : 2m 00s";

        socket.emit('done', {
          'username': $scope.currentUsername,
          'message': $scope.message,
          'avatar': $scope.myAvatar,
          'realUser': true
        });

      } else {
        socket.emit('new_message', {
          'username': $scope.currentUsername,
          'message': $scope.message,
          'avatar': $scope.myAvatar,
          'realUser': true
        });
        $timeout(function() {
          $scope.scrollAdjust();
        }, 500);
      }

      $scope.message = "";
      $timeout(function() {
        $scope.scrollAdjust();
      }, 500);
    }
  };

  $scope.isKeyAvailable = function(key, obj) {
    for (var i = 0; i < obj.length; i++) {
      if (key == obj[i].key) {
        return i;
      }
    }
    return -1;
  };

});
