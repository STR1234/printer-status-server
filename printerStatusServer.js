const http = require("http");
const os = require("os");
const util = require("util");

const hostname = "127.0.0.1";
const port = 3030;

const server = http.createServer(async (request, response) => {
    console.log("Server got a request - gonna handle it :)");
    switch (request.url) {
        case "/": {
            response.statusCode = 200;
            response.setHeader("Content-Type", "text/plain");
            response.end(
                "Welcome to the printer status server!\nThe Server is up and running :)!\n"
            );

            break;
        }
        case "/status": {
            var printerStatus = await checkPrinterStatus();
            // When the printer is not available, 418 is returned - 200 otherwise.
            if (printerStatus === "not available") {
                response.statusCode = 418;
                response.setHeader("Content-Type", "text/plain");
                response.end(printerStatus);
            } else {
                response.statusCode = 200;
                response.setHeader("Content-Type", "text/plain");
                response.end(printerStatus);
            }

            break;
        }
    }
});

server.listen(port, hostname, () => {
    console.log(`Server running at http://${hostname}:${port}/`);
});

async function checkPrinterStatus() {
    var runningWindows = os.type() === "Windows_NT";
    var configuredPrintersCheckList = ["Posiflex DJM32184 Printer"];

    var testPrinterListCommandOutput =
        "Location  Name                           PrinterState  PrinterStatus  ShareName  SystemName          Posiflex DJM32184 Printer       0             3                         DJM32184          OneNote (Desktop)              0             3                         DJM32184          Microsoft XPS Document Writer  0             3                         DJM32184          Microsoft Print to PDF         0             3                         DJM32184          Fax                            0             3                         DJM32184";
    var printerStatus = "not available";
    var availablePrintersListOutput = "noDevicesFound";

    if (runningWindows) {
        console.log("Running on: Windows OS.");
        const exec = util.promisify(require("child_process").exec);
        // Windows command to list all available printers.
        const { error, stdout, stderror } = await exec(
            "wmic printer list brief"
        );
        availablePrintersListOutput = stdout;
        console.log("stdout: " + stdout);
        if (error) {
            printerStatus = "Error trying to get printer status.";

            return printerStatus;
        }

        printerStatus = checkAvailabilityOfCheckListPrinters(
            availablePrintersListOutput,
            configuredPrintersCheckList,
            printerStatus
        );

        return printerStatus;
    } else {
        availablePrintersListOutput = testPrinterListCommandOutput;

        printerStatus = checkAvailabilityOfCheckListPrinters(
            availablePrintersListOutput,
            configuredPrintersCheckList,
            printerStatus
        );

        return printerStatus;
    }
}

function checkAvailabilityOfCheckListPrinters(
    availablePrintersListOutput,
    configuredPrintersCheckList,
    printerStatus
) {
    console.log("Going to check for configured printers availability.");
    console.log(
        "Available printers list output: " + availablePrintersListOutput
    );
    if (availablePrintersListOutput !== "noDevicesFound") {
        console.log("Available printers: " + availablePrintersListOutput);

        configuredPrintersCheckList.forEach((configuredPrinterToCheck) => {
            console.log(
                "check if printer is available: " + configuredPrinterToCheck
            );
            console.log(
                "Is configured printer to check included: " +
                    availablePrintersListOutput.includes(
                        configuredPrinterToCheck
                    )
            );
            if (
                availablePrintersListOutput.includes(configuredPrinterToCheck)
            ) {
                printerStatus = "Configured printer was found :)";
            }
        });
    }

    return printerStatus;
}
