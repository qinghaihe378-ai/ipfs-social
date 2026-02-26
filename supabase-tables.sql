-- 创建用户表
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  nickname VARCHAR(50),
  bio TEXT,
  avatar VARCHAR(255),
  public_key VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);

-- 创建消息表
CREATE TABLE messages (
  id SERIAL PRIMARY KEY,
  from_user VARCHAR(50) NOT NULL,
  to_user VARCHAR(50) NOT NULL,
  content TEXT,
  type VARCHAR(20) DEFAULT 'text',
  file_name VARCHAR(255),
  file_type VARCHAR(50),
  file_size INTEGER,
  cid VARCHAR(255),
  read BOOLEAN DEFAULT false,
  timestamp BIGINT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 创建好友表
CREATE TABLE friends (
  id SERIAL PRIMARY KEY,
  user1 VARCHAR(50) NOT NULL,
  user2 VARCHAR(50) NOT NULL,
  added_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user1, user2)
);

-- 创建群聊表
CREATE TABLE groups (
  id SERIAL PRIMARY KEY,
  group_id VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  creator VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 创建群成员表
CREATE TABLE group_members (
  id SERIAL PRIMARY KEY,
  group_id VARCHAR(50) NOT NULL,
  username VARCHAR(50) NOT NULL,
  joined_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(group_id, username)
);
