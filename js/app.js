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

          if (response.data.firstVisit == true) {
            $window.location.href = './intro.html';
          } else if (response.data.firstVisit == false && response.data.completedComments == false) {
            $window.location.href = './home.html';
          } else {
            $window.location.href = './final.html';
          }

        }, function errorCallback(response) {

          if (response.data == "Invalid email address. Please try again.") {
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
          structure: $scope.user.structure,
          socialPresence: $scope.user.socialPresence
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
  };

});

app.controller('HomeController', function($scope, $http, $window) {
  $scope.questions = [];
  $scope.user = JSON.parse($window.sessionStorage.getItem('user'));

  //HTTP call to get all questions
  $http({
    method: 'POST',
    url: api + '/questions',
    data: {
      "userId": $scope.user.userId,
      "order": $scope.user.order
    },
    type: JSON,
  }).then(function(response) {
    $scope.questions = response.data;
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
  }

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

      console.log(userAnswer);
      $http({
        method: 'POST',
        url: api + '/userAnswer',
        data: userAnswer,
        type: JSON,
      }).then(function(response) {
        //Take to the page with user comments
        modal.style.display = "none";
        $scope.secondClick($scope.modalData);
      }, function(error) {
        console.log("Error occured while submitting initial answer");
      });

    };

  };

  $scope.secondClick = function(q) {
    $('.debating-area').css('display', 'block');
    $('.homecontainer').css('display', 'none');

    var data = {
      socialPresence: $scope.user.socialPresence,
      structure: $scope.user.structure,
      questionId: q.questionNumber,
      questionText: q.text
    };

    //Call to get the relevant user comments
    $http({
      method: 'POST',
      url: api + '/userComments',
      data: data,
      type: JSON,
    }).then(function(response) {
      $scope.qFocused = response.data;
    }, function(error) {
      console.log("Error occured while retrieving user comments on question.");
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

  $scope.submitNewComment = function(qText, qId) {

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
      var q = {
        questionNumber: qId,
        text: qText
      };
      $('.new-textarea').attr('disabled', false);
      $('#new-submit').attr('disabled', false);
      $('#new-submit').css('display', 'none');
      $scope.newComment = "";

      $scope.secondClick(q);
    }, function(error) {
      console.log("Error occured while saving new comment.");
    });

  };

  $scope.sendReply = function(commentId, replyId, qText, qId) {

    var comment = $('#' + replyId).val();
    if ($.trim(comment)) {
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
        questionText: qText
      };

      $http({
        method: 'POST',
        url: api + '/saveReply',
        data: data,
        type: JSON,
      }).then(function(response) {
        var q = {
          questionNumber: qId,
          text: qText
        };
        $scope.secondClick(q);
      }, function(error) {
        console.log("Error occured while retrieving saving reply.");
      });
    } else {
      var q = {
        questionNumber: qId,
        text: qText
      };
      $scope.secondClick(q);
    }
  };

  $scope.updateVoteForComment = function(commentId, qText, qId, vote) {
    var data = {
      questionId: qId,
      socialPresence: $scope.user.socialPresence,
      structure: $scope.user.structure,
      commentId: commentId,
      vote: vote,
      questionText: qText
    };

    $http({
      method: 'POST',
      url: api + '/updateVoteForComment',
      data: data,
      type: JSON,
    }).then(function(response) {
      var q = {
        questionNumber: qId,
        text: qText
      };
      $scope.secondClick(q);
    }, function(error) {
      console.log("Error occured while updating vote count.");
    });
  };

  //Timer till end date
  var countDownDate = new Date("Jun 18, 2020 10:03:00").getTime();

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
        if (response.data.length == 2) {
          $('#completed-submit').attr('disabled', false);
          $('#completed-submit').css('background-color', '#117A65');
          $('#completed-submit').attr('border', '1px solid #117A65');
        } else {
          alert("You are yet to complete answering " + (18 - response.data.length) + " questions. Please answer all questions and return to Home page to proceed.")
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

});

app.controller('FinalController', function($scope, $http, $window) {
  $scope.questions = [];
  $scope.user = JSON.parse($window.sessionStorage.getItem('user'));

  //HTTP call to get all questions
  $http({
    method: 'POST',
    url: api + '/questionsAtVote',
    data: {
      "userId": $scope.user.userId,
      "order": $scope.user.order
    },
    type: JSON,
  }).then(function(response) {
    $scope.questions = response.data;
  }, function(error) {
    console.log("Error occured while retrieving questionsAtVote");
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
        var data = {
          questionNumber: $scope.modalData.questionId,
          text: $scope.modalData.questionText
        };
        $scope.showVotes(data);
      }, function(error) {
        console.log("Error occured while submitting final answer");
      });
    };
  };

  $scope.showCommentsDisabled = function(q) {
    $('.debating-area').css('display', 'block');
    $('.homecontainer').css('display', 'none');

    var data = {
      socialPresence: $scope.user.socialPresence,
      structure: $scope.user.structure,
      questionId: q.questionNumber,
      questionText: q.text
    };

    //Call to get the relevant user comments
    $http({
      method: 'POST',
      url: api + '/userComments',
      data: data,
      type: JSON,
    }).then(function(response) {
      $scope.qFocused = response.data;
    }, function(error) {
      console.log("Error occured while retrieving user comments on question.");
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

      $scope.focusedVotes = response.data;
      modal_vote.style.display = "block";
      $('.modal-first').css('display', 'none');
      $('.modal-votes').css('display', 'inline');

    }, function(error) {
      console.log("Error occured while retrieving votes");
    });
  };

  $scope.showVotesAtHome = function(d) {
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
      $scope.focusedVotes = response.data;
      modal.style.display = "block";
      $('.modal-votes').css('display', 'inline');

    }, function(error) {
      console.log("Error occured while retrieving votes");
    });
  };

  //Timer till end date
  var countDownDate = new Date("Jun 19, 2020 17:40:00").getTime();

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
      document.getElementById("onto-bigfive").innerHTML = "Complete Personality Quiz";
      //Check if user has voted for all questions
      $http({
        method: 'POST',
        url: api + '/votesPerUser',
        data: {
          userId: $scope.user.userId
        },
        type: JSON,
      }).then(function(response) {
        if (response.data.length == 2) {
          $('#onto-bigfive').attr('disabled', false);
          $('#onto-bigfive').css('background-color', '#117A65');
          $('#onto-bigfive').attr('border', '1px solid #117A65');
        } else {
          alert("You are yet to complete voting for " + (18 - response.data.length) + " questions. Please vote for all questions and return to Vote page to proceed.")
        }
      }, function(error) {
        console.log("Error occured while retrieving votes provided by user.");
      });
    }
  }, 1000);

});
