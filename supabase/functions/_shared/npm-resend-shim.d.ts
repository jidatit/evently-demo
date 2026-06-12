/** Deno `npm:` specifier — no `resend` in app package.json; minimal types for Edge usage. */
declare module "npm:resend@2.0.0" {
  export class Resend {
    constructor(apiKey?: string);
    emails: {
      send(args: {
        from: string;
        to: string[];
        subject: string;
        html: string;
      }): Promise<{ error: { message: string } | null }>;
    };
  }
}
