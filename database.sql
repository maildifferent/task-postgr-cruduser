
CREATE TABLE users(
  uid UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(100),
  nickname VARCHAR(30),
  password VARCHAR(100)
);

CREATE UNIQUE INDEX email ON users (email);

CREATE UNIQUE INDEX nickname ON users (nickname);