from flask import Flask, render_template, request, redirect, url_for, session, flash
from flask_socketio import SocketIO, emit
from flask_sqlalchemy import SQLAlchemy
import os
import base64
from datetime import datetime
import pytz

app = Flask(__name__)
app.secret_key = 'your-secret-key'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///chat.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Initialize extensions
db = SQLAlchemy(app)
socketio = SocketIO(app)

# Models
class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password = db.Column(db.String(120), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f'<User {self.username}>'

class Message(db.Model):
    __tablename__ = 'messages'
    id = db.Column(db.Integer, primary_key=True)
    content = db.Column(db.Text, nullable=True)
    image_path = db.Column(db.String(500), nullable=True)
    timestamp = db.Column(db.String(20), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Sender of the message
    sender_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    sender = db.relationship('User', foreign_keys=[sender_id], backref=db.backref('sent_messages', lazy=True))
    
    # Receiver of the message
    receiver_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    receiver = db.relationship('User', foreign_keys=[receiver_id], backref=db.backref('received_messages', lazy=True))

    def __repr__(self):
        return f'<Message {self.id} from {self.sender.username} to {self.receiver.username}>'

    def to_dict(self):
        return {
            'id': self.id,
            'user': self.sender.username,
            'message': self.content,
            'image': self.image_path,
            'timestamp': self.timestamp,
            'created_at': self.created_at.strftime('%Y-%m-%d %H:%M:%S')
        }

# Create database tables
with app.app_context():
    db.create_all()
    # Add default users if they don't exist
    if not User.query.filter_by(username='abhi').first():
        abhi = User(username='abhi', password='415341')
        sanya = User(username='sanya', password='841401')
        db.session.add(abhi)
        db.session.add(sanya)
        db.session.commit()

UPLOAD_FOLDER = 'uploads'
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

def get_current_time():
    # Get current time in IST
    ist = pytz.timezone('Asia/Kolkata')
    now = datetime.now(ist)
    return now.strftime("%I:%M %p")  # Format: HH:MM AM/PM

def get_other_user(current_user):
    return 'sanya' if current_user.lower() == 'abhi' else 'abhi'

@app.route('/')
def login():
    if 'username' in session:
        return redirect('/chat')
    return render_template('login.html')

@app.route('/login', methods=['POST'])
def login_post():
    username = request.form['username'].lower()
    password = request.form['password']
    
    user = User.query.filter_by(username=username).first()
    
    if user and user.password == password:
        session['username'] = username
        flash('Login successful!', 'success')
        return redirect(url_for('chat'))
    else:
        flash('Wrong password! Please try again.', 'error')
        return redirect(url_for('login'))

@app.route('/chat')
def chat():
    if 'username' not in session:
        return redirect('/')
    
    current_user = User.query.filter_by(username=session['username']).first()
    other_username = get_other_user(current_user.username)
    other_user = User.query.filter_by(username=other_username).first()
    
    # Get chat history between these users
    messages = Message.query.filter(
        ((Message.sender_id == current_user.id) & (Message.receiver_id == other_user.id)) |
        ((Message.sender_id == other_user.id) & (Message.receiver_id == current_user.id))
    ).order_by(Message.created_at).all()
    
    chat_history = [msg.to_dict() for msg in messages]
    
    return render_template('chat.html', 
                         username=current_user.username, 
                         other_user=other_user.username,
                         chat_history=chat_history)

@app.route('/logout')
def logout():
    session.pop('username', None)
    return redirect(url_for('login'))

@socketio.on('message')
def handle_message(data):
    if 'username' not in session:
        return
    
    current_user = User.query.filter_by(username=session['username']).first()
    other_username = get_other_user(current_user.username)
    other_user = User.query.filter_by(username=other_username).first()
    
    # Create new message
    message = Message(
        content=data.get('message', ''),
        image_path=data.get('image', None),
        timestamp=get_current_time(),
        sender=current_user,
        receiver=other_user
    )
    
    # Save to database
    db.session.add(message)
    db.session.commit()
    
    # Broadcast message to all clients
    emit('message', message.to_dict(), broadcast=True)

if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=5000, debug=True, allow_unsafe_werkzeug=True)
