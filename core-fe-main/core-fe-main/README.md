# core-fe

## Requirements
For development, you will only need Node.js v16.18 installed on your environment..

### Node
Install node 16.18.0

command to install on Ubuntu: `npm i node@16.18.0`

1. Clone the core-fe repository

    Link to the repository: [Core-FE](https://github.com/Monetizely-Inc/core-fe)
    
    `git clone git@github.com:Monetizely-Inc/core-fe.git`

    `cd core-fe`

2. To start locally: 
  
  * Install dependencies
    
    command: `npm install`
  * To connect with dev environment
  
    command: `npm run start:dev`

    ```Note: 
    Note: If the development environment changes, we need to update the 'env.development.json' file accordingly.
    ```

  * To connect with QA environment
    
    command: `npm run start:staging`

    ```Note: 
    Note: If the development environment changes, we need to update the 'env.staging.json' file accordingly.
    ```

  * To connect with local API's

    * Update the value of REACT_APP_SERVICE_HOST key in the 'env.development.json' file to point it to the locally hosted backend url
    * Once updated, run the command: `npm run start:dev`

3. To prepare Production build
  * Install dependencies
    
    command: `npm install`
  * To build for dev environment

    command: `npm run build:dev`
  * To build for staging or QA environment:

    command: `npm run build:staging`
  * To build for production environment

    command: `npm run build:prod`
