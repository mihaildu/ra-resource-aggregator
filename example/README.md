## Simple example aggregating resources

### Setup

Install all packages
```
yarn
```
or
```
npm install
```

Start a json server that will server data from `db.json`
```
yarn start-json-server
```

Build/bundle the javascript source code
```
yarn build
```

The resulting file will be in `lib` along with `index.html` that loads it.
To view the result you have to serve static file from the `lib` directory.
For example you can use python, run this from `lib`:
Python 2
```
python -m SimpleHTTPServer 8000
```
Python 3
```
python -m http.server 8000
```

Then go at `http://localhost:8000` and the admin should be there!
