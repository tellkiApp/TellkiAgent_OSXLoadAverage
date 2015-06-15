/**
* This script was developed by Guberni and is part of Tellki's Monitoring Solution
*
* June, 2015
* 
* Version 1.0
*
* DESCRIPTION: Monitor OSX Load Average
*
* SYNTAX: node osx_load_average_monitor.js <METRIC_STATE>
* 
* EXAMPLE: node osx_load_average_monitor.js "1,1,1"
*
* README:
*       <METRIC_STATE> is generated internally by Tellki and it's only used by Tellki default monitors.
*       1 - metric is on ; 0 - metric is off
**/

// METRICS

var metrics = [];
metrics['load1min'] =  { retrieveMetric: 1, id: '77:Load 1min Avg:4',  get: function(t) { return parseFloat(t[t.length - 3], 10); } };
metrics['load5min'] =  { retrieveMetric: 1, id: '199:Load 5min Avg:4', get: function(t) { return parseFloat(t[t.length - 2], 10); } };
metrics['load15min'] = { retrieveMetric: 1, id: '59:Load 15min Avg:4', get: function(t) { return parseFloat(t[t.length - 1], 10); } };

// ############# INPUT ###################################

//START
(function() {
    try
    {
        monitorInputProcess(process.argv.slice(2));
    }
    catch(err)
    {   
        console.log(err.message);
        process.exit(1);

    }
}).call(this)

/**
 * Process the passed arguments and send them to monitor execution
 * Receive: arguments to be processed
 */
function monitorInputProcess(args)
{
    if (args[0] != undefined)
    {
        //<METRIC_STATE>
        var metricState = args[0].replace(/\"/g, '');
        var tokens = metricState.split(',');

        if (tokens.length != Object.keys(metrics).length)
            throw new Error('Invalid number of metric state');

        var i = 0;
        for (var key in metrics) 
        {
            if (metrics.hasOwnProperty(key)) 
            {
                metrics[key].retrieveMetric = parseInt(tokens[i]);
                i++;
            }
        }
    }

    monitor();
}

// PROCESS

/**
 * Retrieve metrics information
 */
function monitor()
{
    var process = require('child_process');
     
    var ls = process.exec('uptime', function (error, stdout, stderr) {
        if (error)
            errorHandler(new UnableToGetMetricsError(stderr));

        parseResult(stdout.trim());
    });
        
    ls.on('exit', function (code) {
		if (code === 127)
	   		errorHandler(new UnableToGetMetricsError('Command \'uptime\' not found.'));
		else if (code !== 0)
			errorHandler(new UnableToGetMetricsError());
    });
}

/*
* Parse result from process output
* Receive: string containing results
*/
function parseResult(result)
{
    var outputMetrics = [];
    var tokens = result.replace(/\s+/g, ' ').split(' ');

    for (var key in metrics)
    {
        var metric = metrics[key];
        var value = metric.get(tokens);

        if (isNaN(value))
            errorHandler(new UnableToGetMetricsError());

        var m = new Object();
        m.variableName = key;
        m.id = metric.id;
        m.value = value;
        
        outputMetrics.push(m);
    }

    output(outputMetrics);
}



//################### OUTPUT METRICS ###########################

/*
* Send metrics to console
*/
function output(toOutput)
{
    for (var i in toOutput) 
    {
        var metricToOutput = toOutput[i];

        if (metrics.hasOwnProperty(metricToOutput.variableName)) 
        {
            if(metrics[metricToOutput.variableName].retrieveMetric === 1)
            {
                var output = '';
                
                output += metricToOutput.id + '|';
                output += metricToOutput.value + '|';
                
                console.log(output);
            }
        }
    }
}

//################### ERROR HANDLER #########################
/*
* Used to handle errors of async functions
* Receive: Error/Exception
*/
function errorHandler(err)
{
    if(err instanceof UnableToGetMetricsError)
    {
        console.log(err.message);
        process.exit(err.code);
    }
    else
    {
        console.log(err.message);
        process.exit(1);
    }
}


//####################### EXCEPTIONS ################################

//All exceptions used in script

function UnableToGetMetricsError(msg) {
    this.name = 'UnableToGetMetricsError';
    this.message = (msg === undefined) ? 'Unable to get metrics' : msg;
    this.code = 31;
}
UnableToGetMetricsError.prototype = Object.create(Error.prototype);
UnableToGetMetricsError.prototype.constructor = UnableToGetMetricsError;
