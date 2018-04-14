
$(readyFunction);

function readyFunction(){
    //Move function expressions to top because hoisting doesn't work for them
    var clicked = false, clickY, clickX,
        regexName = /^([a-zA-Z]+\ [A-Za-z]+)$/,
        $friendName = $("#new-friend"),
        $selectError = $('#select-error-alert'),
        $friendList = $('#friend-list'),
        $addButton = $('#add-btn'),
        $removeButton = $('#remove-btn'),
        $roomList = $('#room-list'),
        roomList,
        $refreshAlert =  $('#refresh-alert-holder');

    var renderFriendList = function(data){
        var friends = data['friendList'];

        $friendList.empty();

        if ((friends != null) && (friends.length > 0)){
            $('#del-form').removeClass('hidden');
            $('#no-friends').addClass('hidden');

            friends.forEach(function(value){
                $friendList.append($("<option>", {
                    text: value[0],
                    'data-uun': value[1]
                }));
            })

            if (friends.length === 1)
                $removeButton.text("Remove Friend");
            else
                $removeButton.text("Remove Friends");
        }
        else {
            $('#del-form').addClass('hidden');
            $('#no-friends').removeClass('hidden');            
        }
    };
    var renderRoomList = function(data){
        var roomListHtml = '',
        $currentRoom = $('#maintitle').html();
        roomList = data;
        for (var key in roomList){
            if(roomList.hasOwnProperty(key)){
                roomListHtml += (roomList[key] == $currentRoom) ? '<li class="active">' : '<li>';
                roomListHtml += '<a class="room-no" href="/site/'+key+'">'+ roomList[key]+'</a></li>';
            }
        }
        $roomList.html(roomListHtml);
    };
    var centreMap = function () {
        var myDiv = $("#mapscroll");
        var scrolltoh = (myDiv.prop('scrollHeight') - myDiv.height()) /2;
        var scrolltow = (myDiv.prop('scrollWidth') - myDiv.width()) /2;
        myDiv.scrollTop(scrolltoh);
        myDiv.scrollLeft(scrolltow);
    };

    var smoothCentreMap = function () {
        var myDiv = $("#mapscroll");
        var scrolltoh = (myDiv.prop('scrollHeight') - myDiv.height()) /2;
        var scrolltow = (myDiv.prop('scrollWidth') - myDiv.width()) /2;
        myDiv.animate({scrollTop: scrolltoh, scrollLeft: scrolltow});
    };
    var mapZoom = function  (multiplier, start) {
        myDiv = $("#mapscroll");
        if (myDiv.css('font-size') == "") {
            myDiv.css({'font-size':'15px'});
        }

        if (typeof start === "undefined"){
            start = myDiv.css('font-size');
        }
        
        var newsize = parseFloat(start) + (multiplier * 1) + "px";
        myDiv.css({'font-size' : newsize});
    };
    var updateScrollPos = function(e) {
        $('html').css('cursor', 'move');
        var myDiv = $("#mapscroll");
        myDiv.scrollTop(iPosY - (e.pageY - clickY));
        myDiv.scrollLeft(iPosX - (e.pageX - clickX));
    };

    var timeNow
    var mapUpdate = function(){
        timeNow = new Date();
        var parts = location.pathname.split('/');
        var site = parts.pop() || parts.pop();  // handle potential trailing slash

        $.ajax({ 
            url: `/api/refresh?site=${site}`
        })
            .done(function(data){
                $('#ajax-map-replace').replaceWith(data);   
                centreMap();
                loadMapScroll();
                refreshData();
            });
    };
    var createRefreshAlert = function (status) {
        var statusString = '   <strong>Update Available!</strong> Updating map...';
        if (status == 'False')
            statusString = '  <strong>No Update Available!</strong> Closing this...';
        $refreshAlert.html('<div class="alert alert-info fade in custom-alert"> ' + statusString + '</div>');
        $refreshAlert.css('left',''+ ($(window).width()/2 - $refreshAlert.width()/2) +'px' );
        window.setTimeout(function(){
            $('#manual-refresh').prop('disabled',false);
            $refreshAlert.find('.alert').alert('close');
        }, 2000);
    };
    var checkRefreshAvailable = function(){
        $.ajax({
            url: '/api/update_available',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({
                timestamp : timeNow.toJSON().replace('Z','')
            }),
            dataType:'json'
        })
            .done(function(data) {
                createRefreshAlert(data['status']);
                if(data['status'] != 'False') {
                    mapUpdate();
                }
            });       
    };
    var loadMapScroll = function() {
        $("#mapscroll").on({
            'mousemove': function(e) {
                clicked && updateScrollPos(e);
            },
            'mousedown': function(e) {
                if(e.which == 1){
                    clicked = true;
                    clickY = e.pageY;
                    clickX = e.pageX;
                    iPosY = $("#mapscroll").scrollTop();
                    iPosX = $("#mapscroll").scrollLeft();
                }
            },
            'mouseup': function() {
                clicked = false;
                $('html').css('cursor', 'auto');
            }
        });
    }

    var refreshData = function() {
        /* Execute, self */
        $.ajax({
            url: '/api/friends'
        }).done(function(data) {
            renderFriendList(data);
        });
        
        $.ajax({
            url: '/api/rooms'
        }).done(function(data) {
            renderRoomList(data);
        });
    }

    centreMap();

    // Check for a refresh every five minutes
    window.setInterval(checkRefreshAvailable, 5 * 60 * 1000);
    /*Listeners*/
    
    $('#zoom-in').on('click',function(){
        mapZoom(1)

    });
    $('#zoom-out').on('click',function(){
        mapZoom(-1)
    });
    $('#center-map').on('click',function(){
        mapZoom(0,'15px');
        centreMap();
    });
    $('#manual-refresh').on('click',function(){
        $(this).prop('disabled',true);
        checkRefreshAvailable();
    });
    $addButton.on('click',function(){
        $(this).blur();
    });
    $removeButton.on('click',function(){
        $(this).blur();
    });
    loadMapScroll();

    /* form handling ajaxes */
    $('#del-form').on('submit',function(e){
        e.preventDefault();
        if ($friendList.find('option:selected')['length']>0){ //Check selections aren't empty
            $selectError.addClass('hidden');
            const delfriends = $("#friend-list").find(":selected").toArray().map((o) => $(o).data('uun'));

            $.ajax({
                url: '/api/friends',
                type: 'POST',
                data: {
                    delfriends: delfriends,
                    type: 'del',
                },
            })
                .done(function(data) {
                    renderFriendList(data);
                });
        }
        else {
            if ($selectError.hasClass('hidden'))
                $selectError.removeClass('hidden')
            $selectError.html("<i class=\"fa fa-warning\"></i></i><span class=\"spacer\"></span> No friends selected")
        }
    });

    $('#add-form').on('submit',function(e){
        e.preventDefault();

        $.ajax({
            url: '/api/friends',
            type: 'POST',
            data: $(this).serialize()
        })
            .done(function(data) {
                $friendName.val(''); //Reset the form!
                renderFriendList(data);
            });

    });

    $('.dropdown').on('hide.bs.dropdown',function(){
        $selectError.addClass('hidden');
        $('.dropdown-toggle').blur(); // Removes the focus from the Manage friends after close
    });

    /* Listeners to add a Nice slide transition to dropdowns */
    
    $('.dropdown').on('show.bs.dropdown', function(e){
        $(this).find('.dropdown-menu').first().stop(true, true).fadeIn("fast");
    });
    
    $('.dropdown').on('hide.bs.dropdown', function(e){
        $(this).find('.dropdown-menu').first().stop(true, true).fadeOut("fast");
    });
    
    mapUpdate();
};


