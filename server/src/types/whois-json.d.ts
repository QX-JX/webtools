declare module 'whois-json' {
  interface WhoisResult {
    [key: string]: any;
  }
  
  function whois(domain: string): Promise<WhoisResult>;
  export = whois;
}