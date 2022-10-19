Test example link: 
https://maildif-task-postgr-cruduser.herokuapp.com/pub/test.html

Small CRUD API. Made using:
- Typescript, 
- NodeJS,
- PostgreSQL,
- Express
- Authorization using JWT bearer token

Test example link above opens test page for CRUD API.
This page is created using Mocha framework.
Test page tests HTTP requests (GET, POST, DELETE) to API:
- Signin
- Create users
- Read users
- Delete users

API interface:
- POST /signin {email, nickname, password}, RETURN {token, expire}
- POST /login {email OR nickname, password}, RETURN {token, expire}
-- Protected routes:
- POST /user {email, nickname, password}[], RETURN {uid, email, nickname}[]
- GET /user/email, RETURN {uid, email, nickname}[]
- DELETE /user {filter}, RETURN {uid, email, nickname}[]