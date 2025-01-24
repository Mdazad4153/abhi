from datetime import datetime
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

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
