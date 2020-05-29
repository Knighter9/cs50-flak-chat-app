document.addEventListener("DOMContentLoaded",() => {
    // if there is no username in local storage load the form
    if (!localStorage.getItem('username')) {
        // select the html from the handle bars template
        var source = document.querySelector("#introduction-template").innerHTML;
        // selecting the div
        var destination = document.querySelector(".introduction");
        // set the new HTML
        destination.innerHTML = source;
        // when the button is clicked
        document.querySelector("#submit").onclick = function (){
            const usern = document.querySelector("#username").value;

            // initializing the request
            const request = new XMLHttpRequest();
            request.open("POST","/user");

            // when the request has loaded
            request.onload = () =>{
                let data = JSON.parse(request.responseText);
                if(data.success){
                    let username = data.username;
                    localStorage.setItem('username',username);
                    //history.pushState({'title':'user','text':request.responseText},'user','user')
                    welcome();
                    create_channel();


                }
                else{
                    console.log("There was an error");
                }
            };
            // creating the new form data object
            const complete_form = new FormData();
            // appending the data to the form
            complete_form.append("username",usern);
            // send the request to the /user route
            request.send(complete_form);
            return false;

    };


    }
    // if there is a username in local storage
    else{
        welcome();
        create_channel();
    }

});

function welcome() {
    // create an ajax call to the channels page
    const request = new XMLHttpRequest();
    request.open("GET", "channels");
    // when the request is loaded
    request.onload = () => {
        let data = JSON.parse(request.responseText);

        let channel_list = data.channel;

        // get the username
        let username = localStorage.getItem("username");
        // load the html template
        let source = document.querySelector("#welcome-template").innerHTML;
        let template = Handlebars.compile(source);
        // create the context
        let context = {
            username: username,
            channel_list: channel_list
        };
        // compile the html into the template and get the html
        let html = template(context);
        // get the introduction div to display the html in
        let destination = document.querySelector(".introduction");

        // set the destination html to equal the compiled handlebars html
        destination.innerHTML = html;
        var event = new Event("ajax_loaded");
        document.dispatchEvent(event);


    };
    request.send();
}

function create_channel(){
    document.addEventListener('ajax_loaded', () => {
        button_listener();
        // select all of the buttons with the class list_buttons
        // create the channels part of the javascript
        document.getElementById('channel_submit').onclick = () => {
            let request = new XMLHttpRequest();
            // open the request and set it as a post
            request.open("post", '/channels');

            request.onload = () => {
                // update the channel list by pushing the name of the channel to the channel div
                let data = JSON.parse(request.responseText);
                if (data.success) {
                    let channel = data.channel;
                    // create a button
                    let new_button = document.createElement("button");
                     new_button.append(channel);
                    // append the li into the button
                    new_button.setAttribute("class", "list_button");
                    // create and li
                    let new_li = document.createElement('li');
                    new_li.append(new_button);
                    // access the unordered list and insert the new li
                    document.querySelector("#listed_channels").append(new_li);

                   // reset the input field to have no text in it
                    document.querySelector('#channel_name').value = '';
                    let new_button_event = new Event('new_button_event');
                    document.dispatchEvent(new_button_event);


                } else {
                    console.log("the name is not available");
                    // reset the input field to have no text in it
                    document.querySelector('#channel_name').value = '';
                }

            };
            let channel_name = document.querySelector("#channel_name").value;
            let submit_data = new FormData();
            submit_data.append('channel_name', channel_name);
            request.send(submit_data);
            //return false;
        };
    });
}

// create the websocket so that the event can be admitted

function button_listener(){
    if(localStorage.getItem('username')){
        var socket = io.connect(location.protocol + '//' + document.domain + ':' + location.port);
        socket.on('connect',()=>{
            console.log("the websocket is connected");
            if(localStorage.getItem('channel_name') !== 'standard' && localStorage.getItem('channel_name')) {
                // message(socket,null,localStorage.getItem('channel_name'));
                  var event = new Event("already_on_channel");
                  document.dispatchEvent(event);
            }
            else {
                localStorage.setItem('counter', 0);
                localStorage.setItem('channel_name', 'standard');
                socket.emit('join', {'username': localStorage.getItem('username'), 'channel_name': 'standard'})
            }
        });
        document.addEventListener('already_on_channel',() =>{
            tester_message(socket);
        });
        document.addEventListener('new_button_event',() =>{
            document.querySelectorAll('.list_button').forEach(function(button){
            button.onclick = () =>{
                message(socket,button);
                };
            });
        });
        document.querySelectorAll('.list_button').forEach(function(button){
            button.onclick = () => {
                message(socket,button);


            }
        });

        socket.on('announce message',data =>{
            console.log('The announce message event has been fired');
        //  if(document.querySelector('#welcome_chat').innerText === data.channel_name) {
            const p = document.createElement('p');
            p.innerHTML = `${data.message}\tFrom:${data.username}`;
            p.setAttribute('class', 'user_displayed_message');
            p.setAttribute('id',document.querySelector('username'));
            let username = localStorage.getItem('username');
            if(data.username === username){
                document.querySelector('#user_side_messages').append(p);
            }
            else {
                document.querySelector('#foreign_side').append(p);
            }
    //}
    });
    }

}

function tester_message(socket){
    let channel_name = localStorage.getItem('channel_name');
    socket.emit('join',{'channel_name':channel_name,'username':localStorage.getItem('username')});
    if(document.querySelector('.user_displayed_message')){
        document.querySelectorAll('.user_displayed_message').forEach(function (msg) {
            msg.remove();
        });

    }
    let p = document.querySelector("#welcome_chat");
    p.innerText =  `${channel_name}`;
    // make the message form visible
    document.querySelectorAll('.message').forEach(input =>{
        input.style.visibility = 'visible';
    // create the web socket
    });

     let request = new XMLHttpRequest();
    request.open('POST','/messages');

    request.onload = () =>{
        let data = JSON.parse(request.responseText);
        console.log(data);
        if (data.success) {
            let messages = data.messages;
            console.log(messages);
            let length = messages.length;
            let username = localStorage.getItem('username');
            for (let i = 0; i < length; i++) {
                let p = document.createElement('p');
                console.log(`${messages[i].message} from ${messages[i].username}`);
                p.innerHTML = `${messages[i].message}\tFrom: ${messages[i].username}`;
                p.setAttribute('class', 'user_displayed_message');
                p.setAttribute('id',document.querySelector('username'));
                if(messages[i].username === username){
                    document.querySelector('#user_side_messages').append(p);
                }
                else {
                    document.querySelector('#foreign_side').append(p);
                }
            }
        }
    };
    let submit_data = new FormData();
    submit_data.append('channel_name', channel_name);
    request.send(submit_data);


     document.querySelector("#message_submit").onclick = () =>{
        // get the message
        let user_message = document.querySelector("#user_message").value;
        // remove the text from the input field
        document.querySelector('#user_message').value = '';
        socket.emit('user message',{'user_message':user_message,'username':localStorage.getItem('username'),'channel_name':channel_name})

    };

}

function message(socket,button = null,pre_channel = null) {
    var channel_name = '';
    if (pre_channel == null){
        var old_channel_name = localStorage.getItem('channel_name');
        socket.emit('leave',{'channel_name':old_channel_name,'username':localStorage.getItem('username')});
        channel_name = button.innerText;
        localStorage.setItem('channel_name',channel_name);
        socket.emit('join',{'channel_name':channel_name,'username':localStorage.getItem('username')});

    }
    else if(pre_channel !== null){
        //channel_name = //localStorage.getItem('channel_name');
        channel_name = pre_channel;
        console.log(channel_name);
        console.log('the channel_name has already been here')
    }


    // update the main page to welcome the user to the chat
    let p = document.querySelector("#welcome_chat");
    p.innerText =  `${channel_name}`;
    // make the message form visible
    document.querySelectorAll('.message').forEach(input =>{
        input.style.visibility = 'visible';
    // create the web socket
    });
    if(document.querySelector('.user_displayed_message')){
        document.querySelectorAll('.user_displayed_message').forEach(function (msg) {
            msg.remove();
        });

    }
    // make the ajax requests for the messages
    let request = new XMLHttpRequest();
    request.open('POST','/messages');

    request.onload = () =>{
        let data = JSON.parse(request.responseText);
        console.log(data);
        if (data.success) {
            let messages = data.messages;
            console.log(messages);
            let length = messages.length;
            let username = localStorage.getItem('username');
            for (let i = 0; i < length; i++) {
                let p = document.createElement('p');
                console.log(`${messages[i].message} from ${messages[i].username}`);
                p.innerHTML = `${messages[i].message}\tFrom: ${messages[i].username}`;
                p.setAttribute('class', 'user_displayed_message');
                p.setAttribute('id',document.querySelector('username'));
                if(messages[i].username === username){
                    document.querySelector('#user_side_messages').append(p);
                }
                else {
                    document.querySelector('#foreign_side').append(p);
                }
            }
        }
    };
    let submit_data = new FormData();
    submit_data.append('channel_name', channel_name);
    request.send(submit_data);

    // when the message submit button is clicked run this code
    document.querySelector("#message_submit").onclick = () =>{
        // get the message
        let user_message = document.querySelector("#user_message").value;
        // remove the text from the input field
        document.querySelector('#user_message').value = '';
        console.log('the user message is being submitted');
        socket.emit('user message',{'user_message':user_message,'username':localStorage.getItem('username'),'channel_name':channel_name})

    };


}
/*
window.onpopstate = e =>{
    const data = e.state;
    document.title = data.title;
    document.querySelector('body').innerHTML = data.text;
};
*/

/*
function message(button,socket, pre_channel = null) {
    if (pre_channel == null){

    }
    let old_channel_name = localStorage.getItem('channel_name');
    let channel_name = button.innerText;
    localStorage.setItem('channel_name',channel_name);
    socket.emit('leave',{'channel_name':old_channel_name,'username':localStorage.getItem('username')});

    // update the main page to welcome the user to the chat
    let p = document.querySelector("#welcome_chat");
    p.innerText =  `${channel_name}`;
    // make the message form visible
    document.querySelectorAll('.message').forEach(input =>{
        input.style.visibility = 'visible';
    // create the web socket
    });
    if(document.querySelector('.user_displayed_message')){
        document.querySelectorAll('.user_displayed_message').forEach(function (msg) {
            msg.remove();
        });

    }
    // make the ajax requests for the messages
    let request = new XMLHttpRequest();
    request.open('POST','/messages');

    request.onload = () =>{
        let data = JSON.parse(request.responseText);
        console.log(data);
        if (data.success) {
            let messages = data.messages;
            console.log(messages);
            let length = messages.length;
            for (let i = 0; i < length; i++) {
                let p = document.createElement('p');
                console.log(`${messages[i].message} from ${messages[i].username}`);
                p.innerHTML = `${messages[i].message}\tFrom: ${messages[i].username}`;
                p.setAttribute('class', 'user_displayed_message');
                document.querySelector(".holy-grail-content").append(p);
            }
        }
    };
    let submit_data = new FormData();
    submit_data.append('channel_name', channel_name);
    request.send(submit_data);

    // join the room
    socket.emit('join',{'channel_name':channel_name,'username':localStorage.getItem('username')});
    // when the message submit button is clicked run this code
    document.querySelector("#message_submit").onclick = () =>{
        // get the message
        let user_message = document.querySelector("#user_message").value;
        // remove the text from the input field
        document.querySelector('#user_message').value = '';
        socket.emit('user message',{'user_message':user_message,'username':localStorage.getItem('username'),'channel_name':channel_name})

    };


}
 */

/*
function button_listener(){
    if(localStorage.getItem('username')){
        var socket = io.connect(location.protocol + '//' + document.domain + ':' + location.port);
        socket.on('connect',()=>{
            console.log("the websocket is connected");
            if(localStorage.getItem('channel_name') !== 'standard' && localStorage.getItem('channel_name')){
                // connect the user to the channel
                let channel_name = localStorage.getItem('channel_name');
                                // update the main page to welcome the user to the chat
                let p = document.querySelector("#welcome_chat");
                p.innerText =  `${channel_name}`;
                // make the message form visible
                document.querySelectorAll('.message').forEach(input =>{
                    input.style.visibility = 'visible';
                // create the web socket
                });
                if(document.querySelector('.user_displayed_message')){
                    document.querySelectorAll('.user_displayed_message').forEach(function (msg) {
                        msg.remove();
                    });

                }
                let request = new XMLHttpRequest();
                request.open('POST','/messages');

                request.onload = () =>{
                    let data = JSON.parse(request.responseText);
                    console.log(data);
                    if (data.success) {
                        let messages = data.messages;
                        console.log(messages);
                        let length = messages.length;
                        for (let i = 0; i < length; i++) {
                            let p = document.createElement('p');
                            console.log(`${messages[i].message} from ${messages[i].username}`);
                            p.innerHTML = `${messages[i].message} from ${messages[i].username}`;
                            p.setAttribute('class', 'user_displayed_message');
                            document.querySelector(".holy-grail-content").append(p);
                        }
                    }
                };
                let submit_data = new FormData();
                submit_data.append('channel_name', channel_name);
                request.send(submit_data);

                document.querySelector("#message_submit").onclick = () =>{
                    // get the message
                    let user_message = document.querySelector("#user_message").value;
                    console.log(`The user message was ${user_message}`);
                    // clear the input
                    document.querySelector('#user_message').value = '';
                    socket.emit('user message',{'user_message':user_message,'username':localStorage.getItem('username'),'channel_name':channel_name})

                };


            }
            else {
                localStorage.setItem('counter', 0);
                localStorage.setItem('channel_name', 'standard');
                socket.emit('join', {'username': localStorage.getItem('username'), 'channel_name': 'standard'})
            }
    });
        document.addEventListener('new_button_event',() =>{
            document.querySelectorAll('.list_button').forEach(function(button){
            button.onclick = () =>{
                console.log('The button was clicked');
                let old_channel_name = localStorage.getItem('channel_name');
                let channel_name = button.innerText;
                localStorage.setItem('channel_name',channel_name);
                socket.emit('leave',{'channel_name':old_channel_name,'username':localStorage.getItem('username')});

                // update the main page to welcome the user to the chat
                let p = document.querySelector("#welcome_chat");
                p.innerText =  `${channel_name}`;
                // make the message form visible
                document.querySelectorAll('.message').forEach(input =>{
                    input.style.visibility = 'visible';
                // create the web socket
                });
                if(document.querySelector('.user_displayed_message')){
                    document.querySelectorAll('.user_displayed_message').forEach(function (msg) {
                        msg.remove();
                    });

                }
                // make the ajax requests for the messages
                let request = new XMLHttpRequest();
                request.open('POST','/messages');

                request.onload = () =>{
                    let data = JSON.parse(request.responseText);
                    console.log(data);
                    if (data.success) {
                        let messages = data.messages;
                        console.log(messages);
                        let length = messages.length;
                        for (let i = 0; i < length; i++) {
                            let p = document.createElement('p');
                            console.log(`${messages[i].message} from ${messages[i].username}`);
                            p.innerHTML = `${messages[i].message} from ${messages[i].username}`;
                            p.setAttribute('class', 'user_displayed_message');
                            document.querySelector(".holy-grail-content").append(p);
                        }
                    }
                };
                let submit_data = new FormData();
                submit_data.append('channel_name', channel_name);
                request.send(submit_data);

                // join the room
                socket.emit('join',{'channel_name':channel_name,'username':localStorage.getItem('username')});
                // when the message submit button is clicked run this code
                document.querySelector("#message_submit").onclick = () =>{
                    // get the message
                    let user_message = document.querySelector("#user_message").value;
                    // clear the input
                    document.querySelector('#user_message').value = '';
                    socket.emit('user message',{'user_message':user_message,'username':localStorage.getItem('username'),'channel_name':channel_name})

                };

            };
        });
        });
        document.querySelectorAll('.list_button').forEach(function(button){
            button.onclick = () =>{
                console.log('The button was clicked');
                let old_channel_name = localStorage.getItem('channel_name');
                let channel_name = button.innerText;
                localStorage.setItem('channel_name',channel_name);
                socket.emit('leave',{'channel_name':old_channel_name,'username':localStorage.getItem('username')});

                // update the main page to welcome the user to the chat
                let p = document.querySelector("#welcome_chat");
                p.innerText =  `${channel_name}`;
                // make the message form visible
                document.querySelectorAll('.message').forEach(input =>{
                    input.style.visibility = 'visible';
                // create the web socket
                });
                if(document.querySelector('.user_displayed_message')){
                    document.querySelectorAll('.user_displayed_message').forEach(function (msg) {
                        msg.remove();
                    });

                }
                // make the ajax requests for the messages
                let request = new XMLHttpRequest();
                request.open('POST','/messages');

                request.onload = () =>{
                    let data = JSON.parse(request.responseText);
                    console.log(data);
                    if (data.success) {
                        let messages = data.messages;
                        console.log(messages);
                        let length = messages.length;
                        for (let i = 0; i < length; i++) {
                            let p = document.createElement('p');
                            console.log(`${messages[i].message} from ${messages[i].username}`);
                            p.innerHTML = `${messages[i].message}\tFrom: ${messages[i].username}`;
                            p.setAttribute('class', 'user_displayed_message');
                            document.querySelector(".holy-grail-content").append(p);
                        }
                    }
                };
                let submit_data = new FormData();
                submit_data.append('channel_name', channel_name);
                request.send(submit_data);

                // join the room
                socket.emit('join',{'channel_name':channel_name,'username':localStorage.getItem('username')});
                // when the message submit button is clicked run this code
                document.querySelector("#message_submit").onclick = () =>{
                    // get the message
                    let user_message = document.querySelector("#user_message").value;
                    // remove the text from the input field
                    document.querySelector('#user_message').value = '';
                    socket.emit('user message',{'user_message':user_message,'username':localStorage.getItem('username'),'channel_name':channel_name})

                };

            };
        });
        socket.on('announce message',data =>{
            console.log('The announce message event has been fired');
        //if(document.querySelector('#welcome_chat').innerText === data.channel_name) {
            const p = document.createElement('p');
            p.innerHTML = `${data.message}\tFrom:${data.username}`;
            p.setAttribute('class', 'user_displayed_message');
            document.querySelector(".holy-grail-content").append(p);
        //}
    });
    }

}
 */