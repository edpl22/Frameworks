// Catalog numbers shown on the marketing page. Kept as constants so the
// landing doesn't have to load the whole template/section registry up front;
// a unit test keeps them in sync with the real registries.
export const CATALOG = { templates: 31, presets: 30, sections: 17, stacks: 6 } as const;
