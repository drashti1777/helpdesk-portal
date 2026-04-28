import http from 'http';

const checkServer = () => {
  const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/system/config',
    method: 'GET'
  };

  const req = http.request(options, (res) => {
    console.log(`STATUS: ${res.statusCode}`);
    res.on('data', (chunk) => {
      console.log(`BODY: ${chunk}`);
    });
  });

  req.on('error', (e) => {
    console.error(`problem with request: ${e.message}`);
  });

  req.end();
};

checkServer();
