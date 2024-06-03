CREATE TABLE User(
   UserId INTEGER PRIMARY KEY, 
   Username TEXT NOT NULL,
   Email TEXT NOT NULL
);

CREATE TABLE User_Auth(
   AuthenticationId INTEGER PRIMARY KEY,
   UserId INTEGER NOT NULL, 
   Password_hashed VARCHAR(255) NOT NULL,
   Created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
   FOREIGN KEY (UserId) REFERENCES User(UserId)
);

CREATE TABLE RevisionTopic (
    RevisionTopicId INT PRIMARY KEY,
    UserId INT NOT NULL,
    Title VARCHAR(255) NOT NULL,
    Description TEXT,
    Pomodoro_number INT,
    FOREIGN KEY (UserId) REFERENCES User(UserId)revisiontopic
);