# Tasks

## Main Bugs

1. Add fields persons: type integer for occupied_rooms from table.sql: ❌
2. Add cheking for CSRF attack, for everything req where have session: ❌

## AUTH

1. Add create refres-token to db.✅
2. write method save refresh-token if update data: ✅
3. Send and update jwks.service for data foundend remote: ✅
4. Add verify token: ✅
5. check JWT_EXPIRES: ✅
6. Add middleware for isAuth: ✅
7. Add middleware for isRole: ✅
8. Add with cookies: ✅
9. Add when generate tokens put the refresh token to cookie: ✅
10. Add api refresh auth: ✅
11. Add api logout auth: ✅
12. Add validate for email & phone symbol: ✅
13. Email service: ✅
14. Add a button instead of link: ✅
15. Add params: ✅
16. Add send repaid actication link: ✅
17. Add function for if user is not verify the time your account has been send again activation link: ✅
18. Add new link when user has success reg for forget password: ✅
19. Add isAuth middleware for forget api: ✅
20. Add method for sending email reset_pass: ✅
21. Add new method confirm new password after verify reset link: ✅
22. Add after success reset password and set new password generate new links for reset-pass in next time: ✅
23. Add expire time for set new password 30m if user not setting new password old password setting: ✅
24. Add new fields for user enableResetPassword: value(boolean) when user has been activate reset will be true and after will be false: ✅
25. Add transaction for somewhere where its need: ✅

## Auth Bugs

1. Fixed if api url not correct and app can be contine: ✅
2. Fixed types with req.user: ✅
3. Fixed times with working send email verify: ✅
4. Fixed repaid activate account route: ✅
5. Change time expire verify account 2 minute than 5 minute: ✅
6. Fixed time expire when set value null: ✅
7. Fixed time expire after success login user has been remove: ✅
8. Fixed if email not send has error: ✅
9. Fixed verify: ✅
10. Fixed repaid verify cheking is not working if expire has null: ✅
11. Fixed after verify account again registartion user has been remove: ✅
12. Fixed route for forget password: ✅
13. Fixed forget if timeout verify generate new links && chnage false enable-pass: ✅
14. Refactoring auth class, add abstartc class for scalability: ✅
15. Add expireVerifyForgetPass to DB. The local forget-verify remove: ✅
16. Fixed reset pass link is not updated: ✅
17. Redesing table user and accounts: ✅
18. Rename avatar from user table: ✅
19. Add ref user table with account table: ✅
20. Add new feild to user table "authMehod": ✅
21. Fixed with auth_method if again loginWithService method field has remove: ✅
22. Check expireIn: ✅
23. Fixed decrypt tokens from db for account table not hash: ✅
24. Just add symmetric hash refresh, accessToken must be hash with bcrypt: ✅
25. Fixed sql from oauth.model. Add DO UPDATE AND CONFLICT where they need: ✅

## 2FA

1. Add enable 2FA && just auth user can be this: ✅
2. Add new model for 2FA: ✅
3. Add new service for 2FA: ✅
4. Add timecheck example 1m for 2FA like verify auth: ✅
5. 2FA must be number lenght 6: ✅
6. 2FA sending code with email: ✅
7. 2FA just useing when user has been login: ✅
8. Add service for repaid send email: ✅
9. Add if success or fail opration new generate code: ✅

## OAuth Task

1. Add tabels to db Account: ✅
2. Add handler if user not have to db we must be create him if he have just add userId tabel acccount: ✅
3. Add googleRefreshToken: ✅
4. Add handler when user has success loginWithOauth create new session for token table: ✅
5. Add req for update accessToken from google api: ✅
6. Add transaction for create user if not have main table user must be 2 req to db: ✅
7. Add state for protection CSRF attacks: ✅

## Oauth2.0

1. Google: ✅
2. Github: ✅
3. Telegram: ✅
4. Yandex: ✅

## Redis

### Redis-Auth

1. Add users login: ✅
2. Add user sessions: ✅
3. Add json-bin: ✅
4. Add user registration: ✅
5. Add user refresh-token: ✅

### Redis-Profile

1. Get profile me: ✅

## Profile

1. All api must be with token: ✅
2. Add model profile: ✅
3. Add service profile: ✅
4. Add controller profile: ✅
5. Add endpoint get profile data: ✅
6. Add endpoint update profile data: ✅
7. Add if user just edit some data other must be state old: ✅
8. Add endpoint upload image profile data: ✅
9. Add upload profile image && add validate files includes(format, size, width, height & position): ✅
10. Add endpoint remove image profile data: ✅
11. Add endpoint profile get me with media: **Just add Profile get without media**

### Profile forget password function how use client

1. When user want change password client must be send resetPassLink api example click the button
2. After verify resetPassLink client redirect to set new password and email save to localStorage when enable-rest password active
3. After set new password client redirect to login page.

## Storage for files

1. Add without s3 storage first-time, add local-storage example save one folder on mac-book: ❌
1. Add s3 storage: ❌

## Admin panel

1. Add get all users for admin: **50%**

## Deploy

1. Add KMS for private key: ❌
