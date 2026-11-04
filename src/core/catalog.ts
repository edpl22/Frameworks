// Catalog numbers shown on the marketing page. Kept as constants so the
// landing doesn't have to load the whole template/section registry up front;
// a unit test keeps them in sync with the real registries.
export const CATALOG = { templates: 28, presets: 27, sections: 17, stacks: 6 } as const;
