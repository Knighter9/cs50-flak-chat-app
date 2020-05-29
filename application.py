import os

from flask import Flask,render_template,request,jsonify,redirect,session
from flask_socketio import SocketIO, emit, join_room, leave_room
from flask_session import Session


app = Flask(__name__)
#app.config["SECRET_KEY"] = os.getenv("SECRET_KEY")
app.config["SECRET_KEY"]  = "don'ttellpeople"
socketio = SocketIO(app)
Session(app)
channel_list = ["general","Hello"]
user_names_list = []
channel_chats = {
    'general': [{'message':'this is a test','username':'admin'}],
    'Hello': []

}

@app.route("/")
def index():

    return render_template("index.html")

@app.route("/user", methods = ["POST"])
def user():
    # get the data from the form
    data = request.form.get('username')
    # check to see if username is available
    if data in user_names_list:
        return jsonify({"success":False})
    else:
        user_names_list.append(data)
        print(user_names_list)
        return jsonify({"username":data,"success":True})

@app.route("/channels",methods = ["POST","GET"])
def channels():
    if request.method == "GET":
        if len(channel_list) < 1:
            return jsonify ({"success":False ,"channel":None})
        else:
            return jsonify({"channel":channel_list,"success":True})

    else:
        data = request.form.get("channel_name")
        if data not in channel_list:
            channel_list.append(data)
            #append the data to the channel chats dictionary
            channel_chats[data] = []
            return ({"channel":[data],"success":True})

        else:
            return ({"success":False})

@app.route('/messages', methods = ["POST"])
def messages():
    channel_name = request.form.get('channel_name')
    data = channel_chats[channel_name]
    if data:
        return jsonify({'success':True,"messages":data})
    else:
        return jsonify({'success':False,'messages':data})


@socketio.on("user message")
def vote(data):
    print("what is up with you bots")
    username = data['username']
    message = data['user_message']
    print(username)
    print(message)
    channel_name = data['channel_name']
    print(channel_name)
    channel_chats[channel_name].append({'message':message,'username':username})
    print('the user message event has been fired and is running')

    emit('announce message', {'message':message,'username':username,'channel_name':channel_name}, room=channel_name) #room =channel_name)

@socketio.on("join")
def on_join(data):
    username = data['username']
    channel_name = data['channel_name']
    room = channel_name
    print(f'The join function has been fired and the user {username} will be join the {room} room ')
    join_room(room)

@socketio.on('test')
def on_test():
    emit('pizza', {'fun_message': 'hello i really like pizza'})

@socketio.on('leave')
def on_leave(data):
    username = data['username']
    print(data)
    print(username)
    channel_name = data['channel_name']
    room = channel_name
    print(f'The leave function has been fired and the user {username} has been removed from the {room} room')
    leave_room(room)










