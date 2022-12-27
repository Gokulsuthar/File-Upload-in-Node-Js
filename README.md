`APIs Docs`
=============

Installation
-----------

```
npm install
```

Start Application
-----------

```
npm start
```
will run's the apis on production. 

or
-----------

```
npm run dev
```

will run's the apis on development.

Usage
-----

```
/users (base url)
```

/`register` - POST
-------------

```ruby
{
  "name": "user's name"
  "email": "user@gmail.com",
  "password": "password",
  "passwordConfirm": "password"
}
```

request body must contain this payload in order to create a user

/`login` - POST
-------------

```ruby
{
  "email": "user@gmail.com",
  "password": "password"
}
```

request body must contain this payload in order to login

/`logout` - GET
-------------

```
Just hit the request
```

from postman just hit the request, current logged in user will get logged out

/`forgotPassword` - POST
-------------

```ruby
{
  "email": "user@gmail.com"
}
```

provide email address and hit the required a token will be send to your email address

/`resetPassword/:resetToken` - POST
-------------

```ruby
{
    "password": "new password",
    "passwordConfirm": "new password confirm"
}
```

provide the password reset token that is send to your email in the route params with the required above payload

/`updateMyPassword` - POST
-------------

```ruby
{
    "currentPassword": "current password",
    "password": "new password",
    "passwordConfirm": "new password"
}
```

This endpoint can be use for changing or updating the password of current logged in user

/`uploadImage` - POST
-------------

```ruby
Form/data { key: "image", value: "image.png" }
```

To upload from the postman Form/data set key image and on the value select the image and hit the request.

```ruby
{
  imageId: "63aad9f1f10e2582c030f6e4"
}
```
Uploaded image id

/`image/:imageId` - GET
-------------

```ruby
Image will be shown as a response
```

This end point can be ues to retrive uploaded image coresponding to the provided imageId from the DB.

/`videoUpload` - POST
-------------

```ruby
Form/data { key: "video", value: "video.mp4" }
```

To upload from the postman Form/data set key video and on the value select the video and hit the request.

```ruby
{
  videoId: "63aad9f1f10e2582c030f6e4"
}
```
Uploaded video id

/`video/:videoId` - GET
-------------

```ruby
Video will be play as a response
```

This end point can be use to retrive/watch uploaded video coresponding to the provided videoId from the DB.