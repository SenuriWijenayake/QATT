var app = angular.module('app', []);
var api = 'https://shrouded-atoll-81762.herokuapp.com';
// var api = 'http://localhost:5000';

app.controller('BigFiveController', function($scope, $http, $window) {

  $scope.user = JSON.parse($window.sessionStorage.getItem('user'));
  $.LoadingOverlay("show");
  //Get user status
  $http({
    method: 'POST',
    url: api + '/userById',
    data: {
      userId: $scope.user.userId
    }
  }).then(function(response) {
    if (response.data.completedUES) {
      $('.UES-container').css("display", "none");
      //Get Big five questions
      $http({
        method: 'GET',
        url: api + '/bigFiveQuestions'
      }).then(function(response) {
        $scope.questions = response.data;
        document.getElementById('userId').value = $scope.user.userId;
        $('.big-five-question-container').css("display", "block");
        $.LoadingOverlay("hide");
      }, function(error) {
        console.log("Error occured when loading the big five questions");
        $.LoadingOverlay("hide");
      });

    } else {
      //Get UES questions
      $http({
        method: 'GET',
        url: api + '/UESQuestions'
      }).then(function(response) {
        $scope.uesQuestions = response.data;
        document.getElementById('userId').value = $scope.user.userId;
        $.LoadingOverlay("hide");
      }, function(error) {
        console.log("Error occured when loading the UES questions");
        $.LoadingOverlay("hide");
      });
    }
  }, function(error) {
    console.log("Error occured when checking user status");
    $.LoadingOverlay("hide");
  });

  $scope.UES_Submit = function() {

    //Get the form data
    var UESData = $('#ues-form').serializeArray().reduce(function(obj, item) {
      obj[item.name] = item.value;
      return obj;
    }, {});

    if (Object.getOwnPropertyNames(UESData).length == 13) {
      $.LoadingOverlay("show");
      $('.UES-container').css("display", "none");
      $http({
        method: 'POST',
        url: api + '/engagementSurvey',
        data: UESData
      }).then(function(response) {
        $scope.questions = response.data;
        document.getElementById('userId').value = $scope.user.userId;
        $('.big-five-question-container').css("display", "block");
        $.LoadingOverlay("hide");
      }, function(error) {
        console.log("Error occured when loading the big five questions");
        $.LoadingOverlay("hide");
      });
    }
  };
});

app.controller('IndexController', function($scope, $http, $window) {

  //Change here to change the experimental condition
  $scope.user = {};
  $scope.user.structure = true;
  $scope.user.socialPresence = false;

  $scope.emailValid = false;
  $scope.usernameValid = false;
  $scope.user.firstVisit = true;

  $("#profileImage").click(function(e) {
    $("#imageUpload").click();
  });

  $("#imageUpload").change(function() {
    fasterPreview(this);
  });

  //To check availability of username
  $("#username").change(function() {
    if ($scope.user.socialPresence == false) {
      $http({
        method: 'POST',
        url: api + '/username',
        data: {
          name: $scope.user.name
        },
        type: JSON,
      }).then(function(response) {
        if (response.data) {
          $scope.usernameValid = true;
          $("#username-valid").css("display", "inline");
          $("#username-invalid").css("display", "none");
        } else {
          $scope.usernameValid = false;
          $("#username-invalid").css("display", "inline");
          $("#username-valid").css("display", "none");
          $scope.user.name = "";
          alert("Username already exists. Please try again.");
        }
      }, function(error) {
        console.log("Error occured while validating username");
      });
    }
  });

  //To check availability of email
  $("#email").change(function() {
    $http({
      method: 'POST',
      url: api + '/email',
      data: {
        email: $scope.user.email
      },
      type: JSON,
    }).then(function(response) {
      if (response.data) {
        $scope.emailValid = true;
        $("#email-valid").css("display", "inline");
        $("#email-invalid").css("display", "none");
      } else {
        $scope.emailValid = false;
        $("#email-invalid").css("display", "inline");
        $("#email-valid").css("display", "none");
        $scope.user.email = "";
        alert("An account under this email already exists. Try login.");
      }
    }, function(error) {
      console.log("Error occured while validating email");
    });
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

      new Promise(function(resolve, reject) {
        user.startTime = +new Date();
        $http({
          method: 'POST',
          url: api + '/login',
          data: user,
          type: JSON,
        }).then(function successCallback(response) {

          $("#sign-up-loader").css("display", "none");
          $window.sessionStorage.setItem('user', JSON.stringify(response.data));

          if (response.data.firstVisit == true) {
            $window.location.href = './intro.html';
          } else if (response.data.firstVisit == false && response.data.completedComments == false) {
            $window.location.href = './home.html';
          } else if (response.data.firstVisit == false && response.data.completedComments == true && response.data.completedVotes == false) {
            $window.location.href = './final.html';
          } else if (response.data.firstVisit == false && response.data.completedComments == true && response.data.completedVotes == true && response.data.completedUES == true && response.data.code != null) {
            alert("You have completed the experiment already. Please contact the researcher for further assitance.");
            $window.location.href = './index.html';
          } else {
            $window.location.href = './big-five.html';
          }

        }, function errorCallback(response) {

          if (response.data == "Invalid email address. Please try again.") {
            $scope.user.email = "";
            $scope.user.password = "";
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

    if ((user.socialPresence == false ? $scope.usernameValid : true) && (user.socialPresence == true ? $scope.profilePicture : true) && user.name && user.email && $scope.emailValid && user.password && user.gender && user.age && user.ethnicity && user.education && user.field && (user.gender == 'specified' ? user.genderSpecified : true) && (user.age >= 18)) {

      $("#index-next").attr('disabled', true);
      $("#passwordCheck").attr('disabled', true);
      $("#profile-container").attr('disabled', true);
      $("#imageUpload").attr('disabled', true);
      $(".input-text").attr('disabled', true);
      $(".specify-text").attr('disabled', true);
      $(".radio-button").attr('disabled', true);

      $("#index-next").css('background-color', 'grey');
      $("#index-loader").css("display", "block");

      console.log($scope.profilePicture);

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
          structure: $scope.user.structure,
          socialPresence: $scope.user.socialPresence,
          ethnicity: $scope.user.ethnicity
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
        if (response.status == 401) {
          alert(response.data);
        }
        console.log("Error occured when submitting user details");
        $window.location.href = './index.html';

      });

    }
  };
});

app.controller('IntroController', function($scope, $http, $window, $interval) {
  $scope.user = JSON.parse($window.sessionStorage.getItem('user'));
  $scope.group = [];

  var stop;
  $scope.getGroupUsers = function() {
    if (angular.isDefined(stop)) return;
    stop = $interval(function() {
      if ($scope.group.length >= 10) {
        //Stop checking and enable button
        $scope.stopChecking();
        $("#intro-start").attr("disabled", false);
        $("#intro-start").css("background-color", "#117A65");
        $("#intro-start").css("border", "1px solid #117A65");
      } else {
        //HTTP call to get other users of the same group
        $http({
          method: 'POST',
          url: api + '/usergroup',
          data: {
            userId: $scope.user.userId,
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

    //Start a new session
    var startTime = +new Date();
    $http({
      method: 'POST',
      url: api + '/updateUserSession',
      data: {
        userId: $scope.user.userId,
        startTime: startTime,
        isStart: true
      },
      type: JSON,
    }).then(function(response) {
      //Set up the user object
      $scope.user = JSON.parse($window.sessionStorage.getItem('user'));
      $scope.user.sessionId = response.data;
      $scope.user.startTime = startTime;

      $window.sessionStorage.removeItem('user');
      $window.sessionStorage.setItem('user', JSON.stringify($scope.user));
      $scope.user = JSON.parse($window.sessionStorage.getItem('user'));
      //Update that the user has started the discussion
      $http({
        method: 'POST',
        url: api + '/updateuser',
        data: {
          userId: $scope.user.userId,
          type: "firstVisit",
          value: false
        },
        type: JSON,
      }).then(function(response) {
        $("#intro-loader").css("display", "none");
        $window.location.href = './home.html';
      }, function(error) {
        console.log("Error occured while updating user status");
      });
    }, function(error) {
      console.log("Error occured while creating session");
    });
  };

});

app.controller('HomeController', function($scope, $http, $window, $timeout) {

  $scope.questions = [];
  $scope.user = JSON.parse($window.sessionStorage.getItem('user'));

  $.LoadingOverlay("show");
  //HTTP call to get all questions
  $http({
    method: 'POST',
    url: api + '/questions',
    data: {
      "userId": $scope.user.userId,
      "order": $scope.user.order,
      "socialPresence": $scope.user.socialPresence,
      "structure": $scope.user.structure
    },
    type: JSON,
  }).then(function(response) {
    $scope.questions = response.data;
    $.LoadingOverlay("hide");
  }, function(error) {
    console.log("Error occured while retrieving questions");
  });

  //Modal
  var modal = document.getElementById("modal");
  var span = document.getElementsByClassName("close")[0];

  // When the user clicks on the button, open the modal
  $scope.modalClick = function(q) {

    $scope.modalData = q;
    $scope.answer.opinion = "";
    $scope.answer.confidence = 50;
    $scope.answer.explanation = "";

    $('#opinion-no-label').removeClass('button-no');
    $('#opinion-no-label').addClass('button-no-default');
    $('#opinion-yes-label').removeClass('button-yes');
    $('#opinion-yes-label').addClass('button-yes-default');

    $('.modal-explain').css('display', 'none');
    $('.modal-confidence').css('display', 'none');
    $('#home-submit').css('display', 'none');
    $("#output").val("Not Specified");
    $("#output").css("color", "red");

    //Enable the modal and remove loader
    $("#home-submit").attr("disabled", false);
    $("input[type=radio]").attr('disabled', false);
    $(".modal-textarea").attr("disabled", false);
    $(".slider-one").attr("disabled", false);

    $("#home-submit").css("background-color", "#117A65");
    $("#home-submit").css("border", "1px solid #117A65");
    $("#modal-loader").css("display", "none");

    $scope.opinionProvided = false;
    $scope.explainProvided = false;
    $scope.confProvided = false;
    modal.style.display = "block";
  };

  // When the user clicks on <span> (x), close the modal
  span.onclick = function() {
    modal.style.display = "none";
  }

  // When the user clicks anywhere outside of the modal, close it
  window.onclick = function(event) {
    if (event.target == modal) {
      modal.style.display = "none";
    }
  }

  $(".slidecontainer").change(function() {
    $scope.confProvided = true;
    $("#output").css("color", "green");
    $("#home-submit").css("display", "inline");
  });

  $("#opinion-yes-label").click(function() {
    if (!$('input[type=radio]').is(':disabled')) {
      $scope.answer.opinion = "yes";
      $scope.opinionProvided = true;
      $('#opinion-yes-label').removeClass('button-yes-default');
      $('#opinion-no-label').removeClass('button-no');
      $('#opinion-yes-label').addClass('button-yes');
      $('#opinion-no-label').addClass('button-no-default');
      $('.modal-explain').css('display', 'inline');
    }
  });

  $("#opinion-no-label").click(function() {
    if (!$('input[type=radio]').is(':disabled')) {
      $scope.answer.opinion = "no";
      $scope.opinionProvided = true;
      $('#opinion-yes-label').removeClass('button-yes');
      $('#opinion-yes-label').addClass('button-yes-default');
      $('#opinion-no-label').removeClass('button-no-default');
      $('#opinion-no-label').addClass('button-no');
      $('.modal-explain').css('display', 'inline');
    }
  });

  $(".modal-textarea").keyup(function() {
    if ($.trim($(".modal-textarea").val())) {
      $scope.explainProvided = true;
      $('.modal-confidence').css('display', 'inline');
    }
  });

  $scope.submitAnswer = function(answer) {
    if ($scope.opinionProvided && $scope.confProvided && $scope.explainProvided) {
      $.LoadingOverlay("show");
      //Disable the modal and show loader
      $("#home-submit").attr("disabled", true);
      $("input[type=radio]").attr('disabled', true);
      $(".modal-textarea").attr("disabled", true);
      $(".slider-one").attr("disabled", true);

      $("#home-submit").css("background-color", "grey");
      $("#home-submit").css("border", "1px solid grey");
      $("#modal-loader").css("display", "inline");

      var userAnswer = {
        userId: $scope.user.userId,
        questionId: $scope.modalData.questionNumber,
        questionText: $scope.modalData.text,
        oldAnswer: $scope.answer.opinion,
        oldConfidence: $scope.answer.confidence,
        oldComment: $scope.answer.explanation,
        socialPresence: $scope.user.socialPresence,
        structure: $scope.user.structure,
        userName: $scope.user.name,
        isReply: false
      };

      $http({
        method: 'POST',
        url: api + '/userAnswer',
        data: userAnswer,
        type: JSON,
      }).then(function(response) {
        //Take to the page with user comments
        modal.style.display = "none";
        $scope.showCommentsOnly(response.data);
        $.LoadingOverlay("hide");
        // $scope.secondClick($scope.modalData);
      }, function(error) {
        console.log("Error occured while submitting initial answer");
        $.LoadingOverlay("hide");
      });

    };
  };

  $scope.showCommentsOnly = function(data) {
    $('.debating-area').css('display', 'block');
    $('.homecontainer').css('display', 'none');
    $scope.qFocused = data;
  };

  $scope.secondClick = function(q) {
    $.LoadingOverlay("show");
    $('.debating-area').css('display', 'block');
    $('.homecontainer').css('display', 'none');

    var data = {
      socialPresence: $scope.user.socialPresence,
      structure: $scope.user.structure,
      questionId: q.questionNumber,
      questionText: q.text,
      userId : $scope.user.userId
    };

    //Call to get the relevant user comments
    $http({
      method: 'POST',
      url: api + '/userComments',
      data: data,
      type: JSON,
    }).then(function(response) {
      console.log(response.data);
      $scope.qFocused = response.data;
      $.LoadingOverlay("hide");
    }, function(error) {
      console.log("Error occured while retrieving user comments on question.");
      $.LoadingOverlay("hide");
    });
  };

  $scope.showReply = function(id) {
    $('#' + id).css('display', 'inline');
    $('#' + id + '_reply').css('display', 'none');
    $('#' + id + '_submit').css('display', 'inline');
  };

  $(".new-textarea").keyup(function() {
    if ($.trim($(".new-textarea").val())) {
      $('#new-submit').css('display', 'inline');
    }
  });

  $(".new-textarea-yes").keyup(function() {
    if ($.trim($(".new-textarea-yes").val())) {
      $('#new-submit-yes').css('display', 'inline');
    }
  });

  $(".new-textarea-no").keyup(function() {
    if ($.trim($(".new-textarea-no").val())) {
      $('#new-submit-no').css('display', 'inline');
    }
  });

  $scope.submitNewComment = function(qText, qId) {

    $.LoadingOverlay("show");
    $('.new-textarea').attr('disabled', true);
    $('#new-submit').attr('disabled', true);

    //Prepare the payload to submit new comment
    var data = {
      socialPresence: $scope.user.socialPresence,
      structure: $scope.user.structure,
      questionId: qId,
      userId: $scope.user.userId,
      userName: $scope.user.name,
      comment: $scope.newComment,
      isReply: false,
      questionText: qText
    };

    $http({
      method: 'POST',
      url: api + '/saveReply',
      data: data,
      type: JSON,
    }).then(function(response) {
      // var q = {
      //   questionNumber: qId,
      //   text: qText
      // };
      $('.new-textarea').attr('disabled', false);
      $('#new-submit').attr('disabled', false);
      $('#new-submit').css('display', 'none');
      $scope.newComment = "";
      $scope.showCommentsOnly(response.data);
      $.LoadingOverlay("hide");
      // $scope.secondClick(q);
    }, function(error) {
      console.log("Error occured while saving new comment.");
      $.LoadingOverlay("hide");
    });

  };

  $scope.submitNewStructuredComment = function(qText, qId, isAgree) {
    $.LoadingOverlay("show");
    var x;
    if (isAgree) {
      x = true;
    } else {
      x = false;
    }
    var newComment = (x ? $scope.newCommentYes : $scope.newCommentNo);

    $('.new-textarea-yes').attr('disabled', true);
    $('.new-textarea-no').attr('disabled', true);
    $('#new-submit-yes').attr('disabled', true);
    $('#new-submit-no').attr('disabled', true);

    //Prepare the payload to submit new comment
    var data = {
      socialPresence: $scope.user.socialPresence,
      structure: $scope.user.structure,
      questionId: qId,
      userId: $scope.user.userId,
      userName: $scope.user.name,
      comment: newComment,
      isReply: false,
      questionText: qText,
      isAgree: x
    };

    $http({
      method: 'POST',
      url: api + '/saveReply',
      data: data,
      type: JSON,
    }).then(function(response) {
      // var q = {
      //   questionNumber: qId,
      //   text: qText
      // };
      $('.new-textarea-yes').attr('disabled', false);
      $('.new-textarea-no').attr('disabled', false);
      $('#new-submit-yes').attr('disabled', false);
      $('#new-submit-no').attr('disabled', false);
      $('#new-submit-yes').css('display', 'none');
      $('#new-submit-no').css('display', 'none');

      $scope.newCommentYes = "";
      $scope.newCommentNo = "";
      $scope.showCommentsOnly(response.data);
      $.LoadingOverlay("hide");
      // $scope.secondClick(q);
    }, function(error) {
      console.log("Error occured while saving new comment.");
      $.LoadingOverlay("hide");
    });

  };

  $scope.sendStructuredReply = function(commentId, replyId, qText, qId, isAgree) {

    var x;
    if (isAgree) {
      x = true;
    } else {
      x = false;
    }

    var comment = $('#' + replyId).val();
    if ($.trim(comment)) {
      $.LoadingOverlay("show");
      //Prepare the reply
      var data = {
        socialPresence: $scope.user.socialPresence,
        structure: $scope.user.structure,
        questionId: qId,
        userId: $scope.user.userId,
        userName: $scope.user.name,
        comment: comment,
        isReply: true,
        parentComment: commentId,
        questionText: qText,
        isAgree: x
      };

      $http({
        method: 'POST',
        url: api + '/saveReply',
        data: data,
        type: JSON,
      }).then(function(response) {
        $scope.showCommentsOnly(response.data);
        $.LoadingOverlay("hide");
        // $scope.secondClick(q);
      }, function(error) {
        console.log("Error occured while retrieving saving reply.");
      });
    } else {
      alert("Can't submit blank comment.");
    }
  };

  $scope.sendReply = function(commentId, replyId, qText, qId) {
    var comment = $('#' + replyId).val();
    if ($.trim(comment)) {
      //Prepare the reply
      $.LoadingOverlay("show");
      var data = {
        socialPresence: $scope.user.socialPresence,
        structure: $scope.user.structure,
        questionId: qId,
        userId: $scope.user.userId,
        userName: $scope.user.name,
        comment: comment,
        isReply: true,
        parentComment: commentId,
        questionText: qText
      };

      $http({
        method: 'POST',
        url: api + '/saveReply',
        data: data,
        type: JSON,
      }).then(function(response) {
        // var q = {
        //   questionNumber: qId,
        //   text: qText
        // };
        // $scope.secondClick(q);
        $scope.showCommentsOnly(response.data);
        $.LoadingOverlay("hide");
      }, function(error) {
        console.log("Error occured while retrieving saving reply.");
      });
    } else {
      alert("Can't submit a blank comment.");
    }
  };

  $scope.updateVoteForComment = function(commentId, qText, qId, vote) {

    $.LoadingOverlay("show");
    var e;
    if (vote) {
      e = commentId + "_" + "upvote"
    } else {
      e = commentId + "_" + "downvote"
    }

    var removeVote = false;
    if ($('#' + e).hasClass("have-voted")) {
      // If voted already, remove vote
      removeVote = true;
    }

    var data = {
      questionId: qId,
      socialPresence: $scope.user.socialPresence,
      structure: $scope.user.structure,
      commentId: commentId,
      userId: $scope.user.userId,
      vote: vote,
      removeVote: removeVote,
      questionText: qText
    };

    $http({
      method: 'POST',
      url: api + '/updateVoteForComment',
      data: data,
      type: JSON,
    }).then(function(response) {
      // var q = {
      //   questionNumber: qId,
      //   text: qText
      // };
      // $scope.secondClick(q);
      $scope.showCommentsOnly(response.data);
      $.LoadingOverlay("hide");
    }, function(error) {
      console.log("Error occured while updating vote count.");
    });

  };

  //Timer to complete answers
  var countDownDate = new Date("Aug 16, 2020 00:00:00").getTime();

  // Update the count down every 1 second
  var x = setInterval(function() {
    var now = new Date().getTime();
    var distance = countDownDate - now;

    // Time calculations for days, hours, minutes and seconds
    var days = Math.floor(distance / (1000 * 60 * 60 * 24));
    var hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    var minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    var seconds = Math.floor((distance % (1000 * 60)) / 1000);

    // Display the result in the element with id="demo"
    document.getElementById("completed-submit").innerHTML = days + "d " + hours + "h " +
      minutes + "m " + seconds + "s left till final vote";

    // If the count down is finished, write some text
    if (distance < 0) {
      clearInterval(x);
      document.getElementById("completed-submit").innerHTML = "Take me to the Final Vote page..";
      //Check if user has answered all questions

      $http({
        method: 'POST',
        url: api + '/questionsPerUser',
        data: {
          userId: $scope.user.userId
        },
        type: JSON,
      }).then(function(response) {
        if (response.data.length == 10) {
          $('#completed-submit').attr('disabled', false);
          $('#completed-submit').css('background-color', '#117A65');
          $('#completed-submit').attr('border', '1px solid #117A65');
        } else {
          alert("You are yet to complete answering " + (10 - response.data.length) + " questions. Please answer all questions and return to Home page to proceed.")
        }
      }, function(error) {
        console.log("Error occured while retrieving questions answered by user.");
      });
    }
  }, 1000);

  $scope.finalVote = function() {
    $('#completed-submit-loader').css('display', 'inline');
    $('#completed-submit').attr('disabled', 'true');
    $('#completed-submit').css('background-color', 'grey');
    $('#completed-submit').attr('border', '1px solid grey');

    //Update that the user has moved to final stage
    $http({
      method: 'POST',
      url: api + '/updateuser',
      data: {
        userId: $scope.user.userId,
        type: "completedComments",
        value: true
      },
      type: JSON,
    }).then(function(response) {
      $('#completed-submit-loader').css('display', 'none');
      $window.location.href = './final.html';
    }, function(error) {
      console.log("Error occured while updating user status");
    });
  };

  // Socket Connection
  // var socket = io.connect('http://localhost:5000');
  // var startTime = +new Date();

  //
  // console.log(socket);
  // $window.sessionStorage.setItem('socket', JSON.stringify(socket));
  // socket.emit('new_connection', {
  //   'userId': $scope.user.userId
  // });

  //Code to record session endTimes
  var clickTime = +new Date();
  setInterval(function() {
    var nowDate = +new Date();
    if (nowDate - clickTime >= 600000) {
      //Update user session
      $http({
        method: 'POST',
        url: api + '/updateUserSession',
        data: {
          sessionId: $scope.user.sessionId,
          endTime: nowDate,
          isStart: false
        },
        type: JSON,
      }).then(function(response) {
        $window.location.href = './index.html';
        $window.sessionStorage.removeItem('user');
      }, function(error) {
        console.log("Error occured while updating user session");
      });
    }
  }, 300000);

  $(document)
    .on('click', ResetTimeOutTimer)
    .on('mousemove', ResetTimeOutTimer);

  function ResetTimeOutTimer() {
    clickTime = +new Date();
  };

  $scope.logout = function() {

    $.LoadingOverlay("show");
    var nowDate = +new Date();
    //Update user session
    $http({
      method: 'POST',
      url: api + '/updateUserSession',
      data: {
        sessionId: $scope.user.sessionId,
        endTime: nowDate,
        isStart: false
      },
      type: JSON,
    }).then(function(response) {
      $window.location.href = './index.html';
      $window.sessionStorage.removeItem('user');
      $.LoadingOverlay("hide");
    }, function(error) {
      console.log("Error occured while login out");
      $.LoadingOverlay("hide");
    });
  };

});

app.controller('FinalController', function($scope, $http, $window, $timeout) {
  $scope.questions = [];
  $scope.user = JSON.parse($window.sessionStorage.getItem('user'));
  $.LoadingOverlay("show");
  //HTTP call to get all questions
  $http({
    method: 'POST',
    url: api + '/questionsAtVote',
    data: {
      "userId": $scope.user.userId,
      "order": $scope.user.order,
      "socialPresence": $scope.user.socialPresence,
      "structure": $scope.user.structure
    },
    type: JSON,
  }).then(function(response) {
    $scope.questions = response.data;
    $.LoadingOverlay("hide");
  }, function(error) {
    console.log("Error occured while retrieving questionsAtVote");
    $.LoadingOverlay("hide");
  });

  //Modal
  var modal_vote = document.getElementById("modal-vote");
  var span_vote = document.getElementsByClassName("close-vote")[0];

  //Modal
  var modal = document.getElementById("modal");
  var span = document.getElementsByClassName("close")[0];

  // When the user clicks on <span> (x), close the modal
  span.onclick = function() {
    modal.style.display = "none";
  };

  span_vote.onclick = function() {
    modal_vote.style.display = "none";
  };

  // When the user clicks anywhere outside of the modal, close it
  window.onclick = function(event) {
    if (event.target == modal) {
      modal.style.display = "none";
    } else if (event.target == modal_vote) {
      modal_vote.style.display = "none";
    }
  };

  // When the user clicks on the button, open the modal
  $scope.modalToVote = function(q) {
    //Initializing before the vote
    $scope.modalData = q;
    $scope.answer.newOpinion = "";
    $scope.answer.newConfidence = 50;
    $scope.answer.newExplanation = "";

    $('#opinion-no-label').removeClass('button-no');
    $('#opinion-no-label').addClass('button-no-default');
    $('#opinion-yes-label').removeClass('button-yes');
    $('#opinion-yes-label').addClass('button-yes-default');

    $('.modal-explain').css('display', 'none');
    $('.modal-confidence').css('display', 'none');
    $('#final-submit').css('display', 'none');
    $("#output").val("Not Specified");
    $("#output").css("color", "red");

    $("#final-submit").attr("disabled", false);
    $("input[type=radio]").attr('disabled', false);
    $(".modal-textarea").attr("disabled", false);
    $(".slider-one").attr("disabled", false);

    $("#final-submit").css("background-color", "#117A65");
    $("#final-submit").css("border", "1px solid #117A65");
    $("#modal-loader").css("display", "none");

    //First should always appear first
    $(".modal-first").css("display", "inline");
    $(".modal-votes").css("display", "none");

    $scope.opinionProvided = false;
    $scope.explainProvided = false;
    $scope.confProvided = false;

    modal_vote.style.display = "block";
  };

  $(".slidecontainer").change(function() {
    $scope.confProvided = true;
    $("#output").css("color", "green");
    $("#final-submit").css("display", "inline");
  });

  $("#opinion-yes-label").click(function() {
    if (!$('input[type=radio]').is(':disabled')) {
      $scope.answer.newOpinion = "yes";
      $scope.opinionProvided = true;
      $('#opinion-yes-label').removeClass('button-yes-default');
      $('#opinion-no-label').removeClass('button-no');
      $('#opinion-yes-label').addClass('button-yes');
      $('#opinion-no-label').addClass('button-no-default');
      $('.modal-explain').css('display', 'inline');
    }
  });

  $("#opinion-no-label").click(function() {
    if (!$('input[type=radio]').is(':disabled')) {
      $scope.answer.newOpinion = "no";
      $scope.opinionProvided = true;
      $('#opinion-yes-label').removeClass('button-yes');
      $('#opinion-yes-label').addClass('button-yes-default');
      $('#opinion-no-label').removeClass('button-no-default');
      $('#opinion-no-label').addClass('button-no');
      $('.modal-explain').css('display', 'inline');
    }
  });

  $(".modal-textarea").keyup(function() {
    if ($.trim($(".modal-textarea").val())) {
      $scope.explainProvided = true;
      $('.modal-confidence').css('display', 'inline');
    }
  });

  $scope.submitVote = function(answer) {
    if ($scope.opinionProvided && $scope.confProvided && $scope.explainProvided) {
      $.LoadingOverlay("show");
      //Disable the modal and show loader
      $("#final-submit").attr("disabled", true);
      $("#vote-button-" + $scope.modalData.questionId).css("display", "none");
      $('input[type=radio]').attr('disabled', true);
      $(".modal-textarea").attr("disabled", true);
      $(".slider-one").attr("disabled", true);

      $("#final-submit").css("background-color", "grey");
      $("#final-submit").css("border", "1px solid grey");
      $("#modal-loader").css("display", "inline");

      var userAnswer = {
        userId: $scope.user.userId,
        questionId: $scope.modalData.questionId,
        questionText: $scope.modalData.questionText,
        newAnswer: $scope.answer.newOpinion,
        newConfidence: $scope.answer.newConfidence,
        newComment: $scope.answer.newExplanation,
        socialPresence: $scope.user.socialPresence,
        structure: $scope.user.structure,
        userName: $scope.user.name
      };

      $http({
        method: 'POST',
        url: api + '/updateAnswer',
        data: userAnswer,
        type: JSON,
      }).then(function(response) {
        //To show public answers
        if ($scope.user.socialPresence == true) {
          var data = {
            questionNumber: $scope.modalData.questionId,
            text: $scope.modalData.questionText
          };
          $scope.showVotes(data);
        } else if ($scope.user.socialPresence == false) {
          //No public asnwers
          $.LoadingOverlay("hide");
          modal_vote.style.display = "none";
          $("#voted-button-" + $scope.modalData.questionId).css("display", "inline");
        }
      }, function(error) {
        console.log("Error occured while submitting final answer");
      });
    };
  };

  $scope.showCommentsDisabled = function(q) {
    $.LoadingOverlay("show");
    $('.debating-area').css('display', 'block');
    $('.homecontainer').css('display', 'none');

    var data = {
      socialPresence: $scope.user.socialPresence,
      structure: $scope.user.structure,
      questionId: q.questionNumber,
      questionText: q.text,
      userId : $scope.user.userId
    };

    //Call to get the relevant user comments
    $http({
      method: 'POST',
      url: api + '/userComments',
      data: data,
      type: JSON,
    }).then(function(response) {
      $scope.qFocused = response.data;
      if ($scope.user.socialPresence == false && q.voted == true) {
        $(".vote-button").css("display", "none");
        $(".voted-button").css("display", "inline");
      };
      $.LoadingOverlay("hide");
    }, function(error) {
      console.log("Error occured while retrieving user comments on question.");
      $.LoadingOverlay("hide");
    });
  };

  $scope.showVotes = function(d) {

    var data = {
      questionId: d.questionNumber,
      questionText: d.text,
      socialPresence: $scope.user.socialPresence,
      structure: $scope.user.structure,
    };
    //HTTP Call to get Votes to display
    $http({
      method: 'POST',
      url: api + '/displayVotes',
      data: data,
      type: JSON,
    }).then(function(response) {
      if ($scope.user.structure) {
        var v = response.data.votes;
        var yesVotes = [];
        var noVotes = [];
        var notAttempted = [];
        for (var i = 0; i < v.length; i++) {
          if (v[i].vote == "yes") {
            yesVotes.push(v[i]);
          } else if (v[i].vote == "no") {
            noVotes.push(v[i]);
          } else {
            notAttempted.push(v[i]);
          }
        }
        response.data.yesVotes = yesVotes;
        response.data.noVotes = noVotes;
        response.data.notAttempted = notAttempted;
        response.data.progressY = Math.round(yesVotes.length / (yesVotes.length + noVotes.length) * 100);
        response.data.progressN = Math.round(noVotes.length / (yesVotes.length + noVotes.length) * 100);
      }

      $scope.focusedVotes = response.data;
      $.LoadingOverlay("hide");
      modal_vote.style.display = "block";
      $('.modal-first').css('display', 'none');
      $('.modal-votes').css('display', 'inline');

    }, function(error) {
      console.log("Error occured while retrieving votes");
      $.LoadingOverlay("hide");
    });
  };

  $scope.showVotesAtHome = function(d) {
    $.LoadingOverlay("show");
    $('.debating-area').css('display', 'none');
    $('.homecontainer').css('display', 'block');

    var data = {
      questionId: d.questionNumber,
      questionText: d.text,
      socialPresence: $scope.user.socialPresence,
      structure: $scope.user.structure,
    };
    //HTTP Call to get Votes to display
    $http({
      method: 'POST',
      url: api + '/displayVotes',
      data: data,
      type: JSON,
    }).then(function(response) {
      if ($scope.user.structure) {
        var v = response.data.votes;
        var yesVotes = [];
        var noVotes = [];
        var notAttempted = [];
        for (var i = 0; i < v.length; i++) {
          if (v[i].vote == "yes") {
            yesVotes.push(v[i]);
          } else if (v[i].vote == "no") {
            noVotes.push(v[i]);
          } else {
            notAttempted.push(v[i]);
          }
        }
        response.data.yesVotes = yesVotes;
        response.data.noVotes = noVotes;
        response.data.notAttempted = notAttempted;
        response.data.progressY = Math.round(yesVotes.length / (yesVotes.length + noVotes.length) * 100);
        response.data.progressN = Math.round(noVotes.length / (yesVotes.length + noVotes.length) * 100);
      }

      $scope.focusedVotes = response.data;
      $.LoadingOverlay("hide");
      modal.style.display = "block";
      $('.modal-votes').css('display', 'inline');

    }, function(error) {
      console.log("Error occured while retrieving votes");
      $.LoadingOverlay("hide");
    });
  };

  //Timer to the personality quiz
  var countDownDate = new Date("Aug 18, 2020 00:00:00").getTime();

  // Update the count down every 1 second
  var x = setInterval(function() {
    var now = new Date().getTime();
    var distance = countDownDate - now;

    // Time calculations for days, hours, minutes and seconds
    var days = Math.floor(distance / (1000 * 60 * 60 * 24));
    var hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    var minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    var seconds = Math.floor((distance % (1000 * 60)) / 1000);

    // Display the result in the element with id="demo"
    document.getElementById("onto-bigfive").innerHTML = days + "d " + hours + "h " +
      minutes + "m " + seconds + "s left to complete voting";

    // If the count down is finished, write some text
    if (distance < 0) {
      clearInterval(x);
      document.getElementById("onto-bigfive").innerHTML = "Complete Post Survey Questionnaire";
      //Check if user has voted for all questions
      $http({
        method: 'POST',
        url: api + '/votesPerUser',
        data: {
          userId: $scope.user.userId
        },
        type: JSON,
      }).then(function(response) {
        if (response.data.length == 10) {
          $('#onto-bigfive').attr('disabled', false);
          $('#onto-bigfive').css('background-color', '#117A65');
          $('#onto-bigfive').attr('border', '1px solid #117A65');
        } else {
          alert("You are yet to complete voting for " + (10 - response.data.length) + " questions. Please vote for all questions and return to Vote page to proceed.")
        }
      }, function(error) {
        console.log("Error occured while retrieving votes provided by user.");
      });
    }
  }, 1000);

  $scope.toBigFive = function() {

    $.LoadingOverlay("show");
    $('#completed-vote-loader').css('display', 'inline');
    $('#onto-bigfive').attr('disabled', true);
    $('#onto-bigfive').css('background-color', 'grey');
    $('#onto-bigfive').attr('border', '1px solid grey');

    //Ending the user session
    $http({
      method: 'POST',
      url: api + '/updateUserSession',
      data: {
        sessionId: $scope.user.sessionId,
        endTime: +new Date(),
        isStart: false
      },
      type: JSON,
    }).then(function(response) {
      //Mark user status
      $http({
        method: 'POST',
        url: api + '/updateuser',
        data: {
          userId: $scope.user.userId,
          type: "completedVotes",
          value: true
        },
        type: JSON,
      }).then(function(response) {
        $('#completed-vote-loader').css('display', 'none');
        $window.location.href = './big-five.html';
        $.LoadingOverlay("hide");
      }, function(error) {
        console.log("Error occured while updating user status");
      });
    }, function(error) {
      console.log("Error occured while updating user session");
    });
  };

  //Code to record session endTimes
  var clickTime = +new Date();
  setInterval(function() {
    var nowDate = +new Date();
    if (nowDate - clickTime >= 600000) {
      //Update user session
      $http({
        method: 'POST',
        url: api + '/updateUserSession',
        data: {
          sessionId: $scope.user.sessionId,
          endTime: nowDate,
          isStart: false
        },
        type: JSON,
      }).then(function(response) {
        $window.location.href = './index.html';
        $window.sessionStorage.removeItem('user');
      }, function(error) {
        console.log("Error occured while updating user session");
      });
    }
  }, 300000);

  $(document)
    .on('click', ResetTimeOutTimer)
    .on('mousemove', ResetTimeOutTimer);

  function ResetTimeOutTimer() {
    clickTime = +new Date();
  };

  $scope.logout = function() {

    $.LoadingOverlay("show");
    var nowDate = +new Date();
    //Update user session
    $http({
      method: 'POST',
      url: api + '/updateUserSession',
      data: {
        sessionId: $scope.user.sessionId,
        endTime: nowDate,
        isStart: false
      },
      type: JSON,
    }).then(function(response) {
      $window.location.href = './index.html';
      $window.sessionStorage.removeItem('user');
      $.LoadingOverlay("hide");
    }, function(error) {
      console.log("Error occured while login out");
      $.LoadingOverlay("hide");
    });
  };

});
