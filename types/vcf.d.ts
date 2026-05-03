declare module "vcf" {
  interface VCardProperty {
    valueOf(): string | Record<string, unknown>;
    params?: Record<string, string>;
  }

  interface VCard {
    get(field: string): VCardProperty | VCardProperty[] | undefined;
  }

  function vcfParse(input: string): VCard[];
  export = vcfParse;
}
