import pino from 'pino-http';

const logLevel = process.env.LOG_LEVEL;

const loggerInstance = pino({
  level: logLevel,
  transport:
    logLevel ?
      {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname,req,res,err,responseTime',
        },
      }
    : undefined,
});

export { loggerInstance };
