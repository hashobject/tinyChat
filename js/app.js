page('/', function(){
  setupLandingPage();
});

page('/r/:chatId', function(ctx){
  var chatId = ctx.params.chatId;
  startChat(chatId);
});


page.start();

function setupLandingPage(){
  document.getElementById('new-chat-button').addEventListener('click', function(){
    console.log('xxx');
    var newChatId = uuid.v4();
    page.show('/r/' + newChatId);
  });
}


function startChat(roomId){
  // Connect URL
  var url = 'https://goinstant.net/910bc8662f93/staticshowdown';

  // Connect to GoInstant
  goinstant.connect(url, {room: roomId}, function(err, platformObj, roomObj) {

    if (err) {
      throw err;
    }
    console.log('connected', roomObj);
    if (!goinstant.integrations.GoRTC.support) {
      window.alert('Your browser does not support webrtc');
      return;
    }

    window.goRTC = new goinstant.integrations.GoRTC({
      room: roomObj,
      autoStart: true,
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
      document.getElementById('remote-video').appendChild(peer.video);
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