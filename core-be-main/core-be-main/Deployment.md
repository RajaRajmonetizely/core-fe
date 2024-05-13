**1. Install serverless **
This has to be executed once
```commandline
npm install -g serverless
```

**2. Run requirements.txt file**
```commandline
pip3 install -r requirements.txt
```

**3. Deploy to AWS **
Make sure you have aws cli set up
```commandline
serverless deploy --verbose --stage dev
```

