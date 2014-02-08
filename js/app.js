page('/', function(){
  $('#landing-page').removeClass('hidden');
  $('#chat-page').addClass('hidden');
  setupLandingPage();
});

page('/r/:chatId', function(ctx){
  $('#chat-page').removeClass('hidden');
  $('#landing-page').addClass('hidden');
  var chatId = ctx.params.chatId;
  startChat(chatId);
});


page.start();

function setupLandingPage(){
  $('#new-chat-button').on('click', function(){
    var newChatId = uuid.v4();
    page.show('/r/' + newChatId);
  });
}


function startChat(roomId){
  // Connect URL
  var url = 'https://goinstant.net/910bc8662f93/staticshowdown';

  // DOM refs
  var $localVideo = $('#local-video'),
      $remoteVideo = $('#remote-video')
      $messageInput = $('#message-input'),
      $messages = $('#messages');
  // reference to the pair.
  var pair = null;


  var renderMessage = function(message, ts, mine){
    var html = '<div>' + message + '</div>';
    $messages.append(html);
  };

  var setupChatPage = function(pair){

    $messageInput.on('keydown', function(evt) {
      if (evt.keyCode === 13) {
        var newMessage = $messageInput.val(),
            messageStr = JSON.stringify({ time: Date.now(), msg: newMessage});
        renderMessage(newMessage, Date.now(), true);
        // TODO (anton) can channel be reliable?
        pair.channels.unreliable.send(messageStr);
      }
    });
  };
  var renderNewMessage = function(evt){
    var messageObj = JSON.parse(evt.data);
    renderMessage(messageObj.msg, Date.now(), true);
  };

  // Connect to GoInstant
  goinstant.connect(url, {room: roomId}, function(err, platformObj, roomObj) {

    if (err) {
      throw err;
    }
    if (!goinstant.integrations.GoRTC.support) {
      window.alert('Your browser does not support webrtc');
      return;
    }

    window.goRTC = new goinstant.integrations.GoRTC({
      room: roomObj,
      debug: true,
      video: true,
      audio: false
    });

    goRTC.on('localStream', function() {
      $localVideo.append(goRTC.localVideo);
    });

    goRTC.on('localStreamStopped', function() {
      if (goRTC.localVideo.parentNode) {
        goRTC.localVideo.parentNode.removeChild(goRTC.localVideo);
      }
    });

    goRTC.on('peerStreamAdded', function(peer) {
      console.log("peer added. all peers", goRTC.webrtc.peers);
      // assign peer to only possible pair. 
      if(!pair){
        // TODO (anton) check simple page reload. we need to track amount of peers
        // TODO (anton) Add check if pair added!
        pair = peer;
        // TODO (anton) can channel be reliable?
        pair.channels.unreliable.onmessage = renderNewMessage;
        $remoteVideo.append(peer.video);
        setupChatPage(pair);
      }
    });

    goRTC.on('peerStreamRemoved', function(peer) {
      if (peer.video && peer.video.parentNode) {
        peer.video.parentNode.removeChild(peer.video);
      }
    });

    goRTC.start(function(err) {
      console.log('started');
      if (err) {
        throw err;
      }
    });

  });
}