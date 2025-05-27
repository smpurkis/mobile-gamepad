var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

// Serve static files from dist/public (for Grunt) or client (for direct testing)
app.use(express.static('./dist/public'));
app.use(express.static('./client'));

app.get('/', function(req, res){
  res.sendFile(__dirname + '/client/index.html');
})

io.on('connection', function(socket) {
  console.log('gamepad connected');

  socket.on('disconnect', function() {
    if(socket.inputId !== undefined){
      console.log('goodbye input -> ' + socket.inputId);
    }
    console.log('gamepad disconnected');
    return null;
  });

  socket.on('hello', function() {
    // Simulate a successful connection with input ID 1
    const inputId = 1;
    socket.inputId = inputId;
    console.log('hello input -> ' + socket.inputId);
    socket.emit('hello', {
      inputId: inputId
    });
    return null;
  });

  socket.on('event', function(code) {
    console.log('D-pad event received:', {
      type: code.type,
      code: code.code, 
      value: code.value,
      inputId: socket.inputId
    });
    
    // Log directional events in a more readable format
    if (code.type === 0x03) { // EV_ABS (absolute axis events)
      if (code.code === 0x00) { // ABS_X
        const direction = code.value === 0 ? 'LEFT' : code.value === 255 ? 'RIGHT' : 'CENTER_X';
        console.log(`X-Axis: ${direction} (${code.value})`);
      } else if (code.code === 0x01) { // ABS_Y  
        const direction = code.value === 0 ? 'UP' : code.value === 255 ? 'DOWN' : 'CENTER_Y';
        console.log(`Y-Axis: ${direction} (${code.value})`);
      }
    } else if (code.type === 0x01) { // EV_KEY (button events)
      const state = code.value === 1 ? 'PRESSED' : 'RELEASED';
      console.log(`Button 0x${code.code.toString(16)}: ${state}`);
    }
    
    return null;
  });

});

const PORT = process.env.PORT || 8888;

// Start the server
http.listen(PORT, function() {
    console.log('Development server listening on port ' + PORT);
    console.log('Open http://localhost:' + PORT + ' in your browser');
    console.log('This is a development server - D-pad events will be logged to console');
});

module.exports = app;
