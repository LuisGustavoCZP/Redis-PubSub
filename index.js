const express = require("express");
require('dotenv').config();
const {PORT:port} = process.env;
const Redis = require("ioredis");
const redis_sub = new Redis();
const redis_pub = new Redis();

const app = express();

let configs = {
    loginTries:3,
    failedWait:30
}

redis_sub.subscribe("server-config", (err, count) => {
    if (err) {
      // Just like other commands, subscribe() can fail for some reasons,
      // ex network issues.
      console.error("Failed to subscribe: %s", err.message);
    } else {
      // `count` represents the number of channels this client are currently subscribed to.
      console.log(
        `Subscribed successfully! This client is currently subscribed to ${count} channels.`
      );
    }
});

redis_sub.on("message", (channel, message) => {
    console.log(`Received ${message} from ${channel}`);
    configs = JSON.parse(message);
});

app.get("/", (req, res) => 
{
    const {login_tries, failed_wait} = req.query;
    if(login_tries || failed_wait)
    {
        if(login_tries && login_tries!='') configs.loginTries = login_tries;
        if(failed_wait && failed_wait!='') configs.failedWait = failed_wait;

        redis_pub.publish("server-config", JSON.stringify(configs));
    }
    //console.log(login_tries, "\n", failed_wait);

    res.writeHead(200);
    res.write(`<title>Teste</title>`);
    const keys = Object.keys(configs);
    const infos = keys.reduce((prev, key) => prev+`<li>${key} = ${configs[key]}</li>`, '');
    res.write(`<ol>${infos}</ol>`);
    res.write(`
        <form action="/">
            <input type="number" name="login_tries" placeholder="Numero de tentativas">
            <input type="number" name="failed_wait" placeholder="Tempo de espera">
            <input type="submit" value="Mudar">
        </form>
    `)
    res.end();
});

app.listen(port, ()=>{console.log(`http://localhost:${port}`)});