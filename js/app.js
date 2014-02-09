page('/', function(){
  $('#landing-page').removeClass('hidden');
  $('#chat-page').addClass('hidden');
  setupLandingPage();
});

page('/:chatId', function(ctx){
  $('#chat-page').removeClass('hidden');
  $('#landing-page').addClass('hidden');
  var chatId = ctx.params.chatId;
  startChat(chatId);
});

page.start();

function setupLandingPage(){
  $('#new-chat-button').on('click', function(){
    var newChatId = uuid.v4();
    page.show('/' + newChatId);
  });
}


function startChat(roomId){
  // Connect URL
  var url = 'https://goinstant.net/910bc8662f93/staticshowdown';

  // DOM refs
  var $chatPage = $('#chat-page'),
      $chatSettings = $('#chat-settings'),
      $chatInfoMessage = $('#chat-info-box'),
      $localVideo = $('#local-video'),
      $remoteVideo = $('#remote-video'),
      $messageInputContainer = $('#message-input'),
      $messageInput = $messageInputContainer.find('input'),
      $messages = $('#messages'),
      $messagesList = $messages.find('ul'),
      $inviteLink = $('#invite-link a');

  var inviteLink = "mailto:?subject=Let's chat together";
  inviteLink += '&body=Join me on '+ window.location.href;
  $inviteLink.attr('href', inviteLink);
  // reference to the pair.
  var pair = null;


  $('i.settings-hide').on('click', function(){
    $chatSettings.removeClass('opened').addClass('closed');
  });

  $('i.settings-show').on('click', function(){
    $chatSettings.removeClass('closed').addClass('opened');
  });

  // make messages draggable
  $messages.drags({handle: 'ul'});

  var newInfoMessage = function(msg){
    $chatInfoMessage.html(msg);
    $chatPage.addClass('no-chat');
  };


  var renderMessage = function(message, ts, mine){
    var html = '<li ';
    if(mine){
      html += 'class="mine">';
    }else{
      html += 'class="not-mine">';
    }
    html += message;
    html += '</li>';
    $messagesList.append(html);
    var $allMessages = $('#messages ul li');
    var scrollSize = $allMessages.innerHeight() * $allMessages.length;
    $messagesList.animate({scrollTop: scrollSize}, 300);
  };

  var chan = function(pair){
    // picking any channel here. Probably unreliable is the key in channels object
    var channelName = _.first(_.keys(pair.channels));
    return pair.channels[channelName];
  };

  var setupChatPage = function(pair){
    $chatPage.removeClass('no-chat');
    $messageInput.on('keydown', function(evt) {
      if (evt.keyCode === 13) {
        var newMessage = $messageInput.val(),
            messageStr = JSON.stringify({ time: Date.now(), msg: newMessage});
        renderMessage(newMessage, Date.now(), true);
        chan(pair).send(messageStr);
        $messageInput.val('');
      }
    });
  };

  var unsetupChatPage = function(){
    $messageInput.off('keydown');
  };
  var renderNewMessage = function(evt){
    var messageObj = JSON.parse(evt.data);
    renderMessage(messageObj.msg, Date.now(), false);
  };

  // Connect to GoInstant
  goinstant.connect(url, {room: roomId}, function(err, platformObj, roomObj){

    if(err){
      newInfoMessage('Something went wrong. Try to reload the page!');
      throw err;
    }
    if(!goinstant.integrations.GoRTC.support){
      newInfoMessage('Your browser does not support video chat. Time to try modern browser?');
      return;
    }

    window.goRTC = new goinstant.integrations.GoRTC({
      room: roomObj,
      debug: true,
      video: true,
      audio: false
    });

    goRTC.on('localStream', function(){
      $localVideo.append(goRTC.localVideo);
      $chatPage.addClass('local-video-started');
    });

    goRTC.on('localStreamStopped', function(){
      if(goRTC.localVideo.parentNode) {
        goRTC.localVideo.parentNode.removeChild(goRTC.localVideo);
      }
    });

    goRTC.on('peerStreamAdded', function(peer){
      console.log('peer added. all peers', goRTC.webrtc.peers);
      // assign peer to only possible pair. 
      if(!pair){
        // TODO (anton) check simple page reload. we need to track amount of peers
        pair = peer;
        chan(pair).onmessage = renderNewMessage;
        $remoteVideo.append(peer.video);
        setupChatPage(pair);
      }
    });

    goRTC.on('peerStreamRemoved', function(peer){
      if(peer.video && peer.video.parentNode){
        peer.video.parentNode.removeChild(peer.video);
        pair = null;
        unsetupChatPage();
        newInfoMessage('Seems like you are alone now...');
      }
    });

    goRTC.start(function(err){
      console.log('started');
      // TODO (anton) show some progress here maybe.
      if(err){
        if(err.name && err.name === 'PermissionDeniedError'){
          newInfoMessage('You need to allow camera access. Reload the page and try again.');
        }else{
          newInfoMessage('Something went wrong. Try to reload the page!');
          throw err;
        }
      }
    });

  });
}