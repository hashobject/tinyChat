page('/', function(){
  document.getElementById('landing-page').classList.remove('hidden');
  document.getElementById('chat-page').classList.add('hidden');
  setupLandingPage();
});

page('/r/:chatId', function(ctx){
  document.getElementById('chat-page').classList.remove('hidden');
  document.getElementById('landing-page').classList.add('hidden');
  var chatId = ctx.params.chatId;
  startChat(chatId);
});


page.start();

function setupLandingPage(){
  document.getElementById('new-chat-button').addEventListener('click', function(){
    var newChatId = uuid.v4();
    page.show('/r/' + newChatId);
  });
}


function startChat(roomId){
  // Connect URL
  var url = 'https://goinstant.net/910bc8662f93/staticshowdown';


  // reference to the pair.
  var pair = null;


  var setupChatPage = function(pair){
    var $messageInput = document.getElementById('message-input'),
        $messages = document.getElementById('messages');
    $messageInput.addEventListener('keydown', function(evt) {
      if (evt.keyCode === 13) {
        var newMessage = $messageInput.value,
            html = '<div>' + newMessage + '</div>';
        //$messages.appendChild(html);
        // TODO (anton) can channel be reliable?
        pair.channels.unreliable.send({ time: Date.now(), msg: newMessage});
      }
    });
  };
  var renderNewMessage = function(evt){
    console.log('message was added', evt);
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

    roomObj.on('join', function(userObject) {
      console.log(userObject.displayName + ' has joined the room!');
    });

    window.goRTC = new goinstant.integrations.GoRTC({
      room: roomObj,
      debug: true,
      video: true,
      audio: false
    });

    goRTC.on('localStream', function() {
      document.getElementById('local-video').appendChild(goRTC.localVideo);
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
        // TODO (anton) Add check if pair added!
        pair = peer;
        // TODO (anton) can channel be reliable?
        pair.channels.unreliable.onmessage = renderNewMessage;
        document.getElementById('remote-video').appendChild(peer.video);
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