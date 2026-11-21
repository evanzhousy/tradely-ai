import { config } from "zod";

// The assistant's sandbox forbids eval. Without this, zod probes `Function("")` the first time a
// schema parses and the host logs a CSP violation. Imported first so it runs before any schema.
config({ jitless: true });
