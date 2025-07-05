#DEVPULSE API

##AuthRouter:

    - POST /signup
    - POST /login
    - POST /logout

##profileRouter:

    - GET /profile/edit
    - PATCH /profile/view
    - PATH /profile/password

##connectionRequestRouter:

    - POST /request/send/interested/:userId
    - POST /request/send/ignore/:userId
    - POST /request/send/status/:userId // for both of the above

    - POST /request/review/accepted/:requestId
    - POST /request/review/rejected/:requestId
    - POST /request/review/status/:requestId // for both of the above

##userRouter:

    - GET /connections
    - GET /request/recevied
    - GET /feed - Gets us the profiles of other users

Status_Of_Connection :- 1. Ignore | 2. Interested:- a. Accecpted , b. Rejected
