var net = require("net"),
    cmd = require("commander");

process.on("uncaughtException", function(e) {
    console.log(e);
});

var requiredArgs = ['serviceHost', 'servicePort', 'proxyPort'],
    missing = [];

cmd.version('1.0.0')
    .description('Provides a simple tcp service port proxy')
    .option('-h, --serviceHost [host]', 'Local service host name')
    .option('-s, --servicePort [port]', 'Local service port')
    .option('-p, --proxyPort [name]', 'External proxy port')
    .parse(process.argv);

requiredArgs.forEach(function (arg) {
    if (!cmd[arg]) {
        missing.push(arg);
    }
});

if (missing.length) {
    console.log("  OH FARTS! missing required argument(s): \"%s\"", missing.join("\", \""));
    cmd.outputHelp();
    process.exit(1);
}

net.createServer(function (proxySocket) {
    var connected = false;
    var buffers = new Array();
    var serviceSocket = new net.Socket();
    serviceSocket.connect(parseInt(cmd.servicePort), cmd.serviceHost, function() {
        connected = true;
        if (buffers.length > 0) {
            for (i = 0; i < buffers.length; i++) {
                console.log(buffers[i]);
                serviceSocket.write(buffers[i]);
            }
        }
    });
    proxySocket.on("error", function (e) {
        serviceSocket.end();
    });
    serviceSocket.on("error", function (e) {
        console.log("Could not connect to service at host "
            + cmd.serviceHost + ', port ' + cmd.servicePort);
        proxySocket.end();
    });
    proxySocket.on("data", function (data) {
        if (connected) {
            serviceSocket.write(data);
        } else {
            buffers[buffers.length] = data;
        }
    });
    serviceSocket.on("data", function(data) {
        proxySocket.write(data);
    });
    proxySocket.on("close", function(err) {
        serviceSocket.end();
    });
    serviceSocket.on("close", function(err) {
        proxySocket.end();
    });
}).listen(cmd.proxyPort)
