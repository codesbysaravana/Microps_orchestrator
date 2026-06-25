require('dotenv').config();

const JENKINS_URL = process.env.JENKINS_URL;

const getCrumb = async () => {
    const auth = Buffer .from(`${process.env.JENKINS_API_USER}:${process.env.JENKINS_API_KEY}`).toString('base64');

    try {
        const data = await fetch(`${JENKINS_URL}/crumbIssuer/api/json`, {
            method: 'GET',
            headers: {
                'Content-type': 'application/json',
                'Authorization': `Basic ${auth}`
            }
        });
        console.log(data.headers.get('set-cookie'));
        console.log(data);
        const cookie = data.headers.get('set-cookie');
        const crumb = await data.json();
        ///console.log(crumb.headers.get('set-cookie')); error cuz json()
        console.log(crumb);
        return { crumb, cookie };

    } catch (err) {
        console.log(err);
        console.log("error getting Crumb");
    }
}

module.exports = { getCrumb };
//empty fetch() without a await willl return a promise

//Jenkins Session validate {session + Crumb}together as one SO WHERES THE COOKIE?!?!
//NOTE I HIT A BUG WITHOUT the dang COOKIES IN CRUMBS SO data.headers.get('set-cookie") gets the cookie



/* EXAMPLE RESPONSE from this logging

ara@saravana MINGW64 ~/Downloads/java-backend-mrcooper/microps/server
$ node utils/getJenkinsCrumb.js 
◇ injected env (3) from .env // tip: ⌘ custom filepath { path: '/custom/path/.env' }
JSESSIONID.e82faf99=node01q6b2egebh7fj16uiyeo0sjcia11.node0; Path=/; HttpOnly
Response {
  status: 200,
  statusText: 'OK',
  headers: Headers {
    server: 'Jetty(12.0.17)',
    date: 'Mon, 01 Jun 2026 13:48:36 GMT',
    vary: 'Accept-Encoding',
    'x-content-type-options': 'nosniff',
    'x-jenkins': '2.492.3',
    'x-jenkins-session': '543bce0a',
    'x-frame-options': 'deny',
    'content-type': 'application/json;charset=utf-8',
    'set-cookie': 'JSESSIONID.e82faf99=node01q6b2egebh7fj16uiyeo0sjcia11.node0; Path=/; HttpOnly',
    expires: 'Thu, 01 Jan 1970 00:00:00 GMT',
    'content-encoding': 'gzip',
    'content-length': '153'
  },
  body: ReadableStream { locked: false, state: 'readable', supportsBYOB: true },
  bodyUsed: false,
  ok: true,
  redirected: false,
  type: 'basic',
  url: 'http://localhost:8080/crumbIssuer/api/json'
}
{
  _class: 'hudson.security.csrf.DefaultCrumbIssuer',
  crumb: '16bde6152f28a613bc166a9ef8e957da822bbdbb5ae663d953d3ac7f1e5799db',
  crumbRequestField: 'Jenkins-Crumb'
}

csara@saravana MINGW64 ~/Downloads/java-backend-mrcooper/microps/server
$  */