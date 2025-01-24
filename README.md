# Real-Time Chat Application

A real-time chat application built with Flask and Socket.IO that allows two users (Abhi and Sanya) to chat with each other. The application supports text messages and image sharing.

## Features

- Real-time messaging using Socket.IO
- User authentication
- Image sharing (both gallery and camera)
- Message history stored in SQLite database
- Mobile-friendly responsive design
- Image preview and download options
- Real-time message delivery
- Proper timestamps in IST

## Installation

1. Clone the repository:
```bash
git clone [repository-url]
cd [repository-name]
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Run the application:
```bash
python app.py
```

4. Access the application:
- Open `http://localhost:5000` in your browser
- For access from other devices on the same network, use `http://[your-ip]:5000`

## Default Users

The application comes with two predefined users:
- Username: abhi, Password: 415341
- Username: sanya, Password: 841401

## Technologies Used

- Flask: Web framework
- Socket.IO: Real-time communication
- SQLite: Database
- HTML/CSS/JavaScript: Frontend
- Font Awesome: Icons

## Features in Detail

1. **User Authentication**
   - Secure login system
   - Password validation
   - Session management

2. **Real-time Chat**
   - Instant message delivery
   - Message history
   - Typing indicators
   - Read receipts

3. **Image Sharing**
   - Gallery image upload
   - Camera capture
   - Image preview
   - Download option
   - Size limit validation

4. **Mobile Optimization**
   - Responsive design
   - Touch-friendly interface
   - Mobile camera access
   - Proper keyboard handling

5. **Database Storage**
   - Message persistence
   - User management
   - Efficient queries
   - Data relationships

## File Structure

- `app.py`: Main application file
- `templates/`: HTML templates
  - `login.html`: Login page
  - `chat.html`: Chat interface
- `requirements.txt`: Python dependencies
- `uploads/`: Directory for uploaded images
- `.gitignore`: Git ignore file
- `README.md`: Project documentation
