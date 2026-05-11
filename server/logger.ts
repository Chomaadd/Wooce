export const clr = {
  dim:     "\x1b[2m",
  reset:   "\x1b[0m",
  bold:    "\x1b[1m",
  green:   "\x1b[32m",
  yellow:  "\x1b[33m",
  red:     "\x1b[31m",
  cyan:    "\x1b[36m",
  blue:    "\x1b[34m",
  magenta: "\x1b[35m",
};

const SOURCE_COLORS: Record<string, string> = {
  express: clr.cyan,
  mongodb: clr.green,
};

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
  const color = SOURCE_COLORS[source] ?? clr.dim;
  const tag   = `${color}[${source}]${clr.reset}`;
  console.log(`${clr.dim}${formattedTime}${clr.reset} ${tag} ${message}`);
}

export function colorMethod(method: string) {
  const map: Record<string, string> = {
    GET:    clr.green,
    POST:   clr.blue,
    PUT:    clr.yellow,
    PATCH:  clr.cyan,
    DELETE: clr.red,
  };
  return (map[method] ?? clr.dim) + method.padEnd(6) + clr.reset;
}

export function colorStatus(status: number) {
  if (status >= 500) return clr.red    + status + clr.reset;
  if (status >= 400) return clr.yellow + status + clr.reset;
  if (status >= 300) return clr.dim    + status + clr.reset;
  return clr.green + status + clr.reset;
}
