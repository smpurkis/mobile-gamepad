$(window).load(function() {

    // turn off context menu
    document.oncontextmenu = function(event) {
        if (event.preventDefault) {
            event.preventDefault();
        }
        if (event.stopPropagation) {
            event.stopPropagation();
        }
        event.cancelBubble = true;
        return false;
    }

    // HAPTIC CALLBACK METHOD
    navigator.vibrate = navigator.vibrate || navigator.webkitVibrate || navigator.mozVibrate || navigator.msVibrate;
    var hapticCallback = function() {
        if (navigator.vibrate) {
            navigator.vibrate(50); // Increased vibration duration for better feedback
        }
    }

    // D-pad state tracking
    var dpadState = {
        up: false,
        down: false,
        left: false,
        right: false
    };

    // Send D-pad events based on current state
    var sendDpadEvent = function() {
        var x = 127; // Center X
        var y = 127; // Center Y
        
        if (dpadState.left && !dpadState.right) {
            x = 0; // Left
        } else if (dpadState.right && !dpadState.left) {
            x = 255; // Right
        }
        
        if (dpadState.up && !dpadState.down) {
            y = 0; // Up
        } else if (dpadState.down && !dpadState.up) {
            y = 255; // Down
        }
        
        sendEvent(0x03, 0x00, x);
        sendEvent(0x03, 0x01, y);
    };

    // create socket connection
    var socket = io();
    socket
        .on("connect", function() {
            if(!$("#warning-message").is(":visible")) {
                $("#wrapper").show();
                $("#disconnect-message").hide();
            }
            socket.emit('hello', 'add new input');
        })
        .on("hello", function(data) {
            var gamePadId = data.inputId;

            $("#padText").html("<h1>Nr " + gamePadId + "</h1>");

            // Handle regular buttons (not D-pad)
            $(".btn:not(.dpad-button)")
                .off("touchstart touchend mousedown mouseup")
                .on("touchstart mousedown", function(event) {
                    event.preventDefault();
                    socket.emit("event", {
                        type: 0x01,
                        code: $(this).data("code"),
                        value: 1
                    });
                    $(this).addClass("active");
                    hapticCallback();
                })
                .on("touchend mouseup", function(event) {
                    event.preventDefault();
                    socket.emit("event", {
                        type: 0x01,
                        code: $(this).data("code"),
                        value: 0
                    });
                    $(this).removeClass("active");
                });

            // Handle D-pad buttons
            $(".dpad-button")
                .off("touchstart touchend mousedown mouseup")
                .on("touchstart mousedown", function(event) {
                    event.preventDefault();
                    var direction = $(this).data("direction");
                    dpadState[direction] = true;
                    $(this).addClass("active");
                    sendDpadEvent();
                    hapticCallback();
                })
                .on("touchend mouseup", function(event) {
                    event.preventDefault();
                    var direction = $(this).data("direction");
                    dpadState[direction] = false;
                    $(this).removeClass("active");
                    sendDpadEvent();
                });
        })
        .on('disconnect', function() {
            if(!$("#warning-message").is(":visible")) {
                $("#wrapper").hide();
                $("#disconnect-message").show();
            }
        });

    sendEvent = function(type, code, value) {
        socket.emit("event", {
            type: type,
            code: code,
            value: value
        });
    };

    // Reload page when gamepad is disconnected
    $("#disconnect-message").click(function() {
        location.reload();
    });

});
