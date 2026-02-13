export enum LogLevel {
  debug = 0,
  info = 1,
  warn = 2,
  error = 3,
}

class Logger {
  level: LogLevel = LogLevel.info;
  format: "json" | "text" = "text";

  debug(message: string): void {
    if (this.level <= LogLevel.debug) this.log("debug", message);
  }

  info(message: string): void {
    if (this.level <= LogLevel.info) this.log("info", message);
  }

  warn(message: string): void {
    if (this.level <= LogLevel.warn) this.log("warn", message);
  }

  error(message: string): void {
    if (this.level <= LogLevel.error) this.log("error", message);
  }

  private log(level: string, message: string): void {
    // Always write to stderr to avoid interfering with stdio MCP transport
    if (this.format === "json") {
      process.stderr.write(
        `${JSON.stringify({ level, message, timestamp: new Date().toISOString() })}\n`,
      );
    } else {
      process.stderr.write(`[${new Date().toISOString()}] [${level.toUpperCase()}] ${message}\n`);
    }
  }
}

export const logger = new Logger();
