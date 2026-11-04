// Catalog numbers shown on the marketing page. Kept as constants so the
// landing doesn't have to load the whole template/section registry up front;
// a unit test keeps them in sync with the real registries.
export const CATALOG = { templates: 20, presets: 19, sections: 16, stacks: 6 } as const;
