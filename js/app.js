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


  var renderMessage = function(message, mine){
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


  var setupChatPage = function(pair){
    pair.on('channelMessage', function(peer, channelId, message) {
      renderMessage(message.payload.msg, false);
    });
    $chatPage.removeClass('no-chat').addClass('remote-video-started');
    $messageInput.on('keydown', function(evt) {
      if(evt.keyCode === 13) {
        var newMessage = $messageInput.val(),
            messageStr = JSON.stringify({ time: Date.now(), msg: newMessage});
        renderMessage(newMessage, true);
        pair.sendDirectly(roomId, 'message', { time: Date.now(), msg: newMessage});
        $messageInput.val('');
      }
    });
  };


  var unsetupChatPage = function(){
    $chatPage.addClass('no-chat').removeClass('remote-video-started');
    $messageInput.off('keydown');
  };


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


  webrtc.on('readyToCall', function() {
    console.log('ready to call');
    webrtc.createRoom(roomId, function (err, name) {
      if (err) {
        // join room
        webrtc.joinRoom(roomId);
      } else {
        console.log('room was created', err, name);
      }
    });
  });

  webrtc.on('videoAdded', function(video, peer) {
    console.log('peer added', peer);
    // assign peer to only possible pair.
    if(!pair){
      pair = peer;
      setupChatPage(pair);
    }
  });

  webrtc.on('videoRemoved', function(video, peer) {
    if(peer){
      pair = null;
      unsetupChatPage();
      newInfoMessage('Seems like you are alone now...');
    }
  });
}
