page('/', function(){
  $('#landing-page').removeClass('hidden');
  $('#chat-page').addClass('hidden');
  $('#for-geeks-button').on('click', function(){
    $('#for-geeks').removeClass('closed');
  });
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
  inviteLink += '&body=Join me on '+ window.location.origin + '/' + roomId;
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
    $chatPage.removeClass('no-chat').addClass('remote-video-started');
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
    $chatPage.addClass('no-chat').removeClass('remote-video-started');
    $messageInput.off('keydown');
  };
  var renderNewMessage = function(evt){
    var messageObj = JSON.parse(evt.data);
    renderMessage(messageObj.msg, Date.now(), false);
  };

  // Connect to GoInstant
  window.webrtc = new SimpleWebRTC({
    // the id/element dom element that will hold "our" video
    localVideoEl: 'local-video',
    // the id/element dom element that will hold remote videos
    remoteVideosEl: 'remote-video',
    // immediately ask for camera access
    autoRequestMedia: true,
    media: {
        video: true,
        audio: false
    },
  });

  webrtc.createRoom(roomId, function (err, name) {
    console.log('room was created', err, name);
  });

  webrtc.on('readyToCall', function () {
    // join room
    webrtc.joinRoom(roomId);
    console.log('ready to call');
  });

  webrtc.on('videoAdded', function (video, peer) {
    console.log('peer added', peer);
    // assign peer to only possible pair.
    if(!pair){
      pair = peer;
      chan(pair).onmessage = renderNewMessage;
      $remoteVideo.append(peer.video);
      setupChatPage(pair);
    }
  });

  webrtc.on('videoRemoved', function (video, peer) {
    if(peer.video && peer.video.parentNode){
      peer.video.parentNode.removeChild(peer.video);
      pair = null;
      unsetupChatPage();
      newInfoMessage('Seems like you are alone now...');
    }
  });
}
